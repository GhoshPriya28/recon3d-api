<?php
error_reporting(0);
defined('BASEPATH') OR exit('No direct script access allowed');
include_once APPPATH . "libraries/vendor/autoload.php";
require (APPPATH.'libraries/REST_Controller.php');
header("Access-Control-Allow-Origin: * ");
header("Access-Control-Allow-Methods: POST, GET");
class Authentication extends REST_Controller 
{

    public function __construct()
    {
        parent::__construct();
        $this->load->model(['api/authentication_model','api/validate_model']);
        $this->load->helper(array('authorization','jwt','common'));
        $this->load->library(['otp','serialize_models']);
        $this->read_db = $this->load->database('read_db', true);
    }

    public function register_POST()
    {
        $post_data = json_decode($this->security->xss_clean($this->input->raw_input_stream));
        if (isset($post_data->firstName) && !empty($post_data->firstName) && isset($post_data->lastName) && !empty($post_data->lastName) && isset($post_data->email) && isset($post_data->password) && isset($post_data->mobile) && !empty($post_data->mobile) && isset($post_data->pincode) && isset($post_data->address) && isset($post_data->uid) && isset($post_data->dob) && isset($post_data->gender) && isset($post_data->countryCode) && isset($post_data->profileType) && !empty($post_data->profileType))
        {
            $userData=array(
                'user_id' => uniqid(),
                'first_name' => trim($post_data->firstName),
                'last_name' => trim($post_data->lastName),
                'uid' => trim($post_data->uid),
                'password' => password_hash(trim($post_data->password), PASSWORD_DEFAULT),
                'mobile' => trim($post_data->mobile),
                'email' => trim($post_data->email),
                'dob' => $post_data->dob,
                'gender' => ($post_data->gender == 'male')?'M':(($post_data->gender == 'female')?'F':''),
                'address' => $post_data->address,
                'pincode' => $post_data->pincode,
                'country_code' => $post_data->countryCode,
                'profile_type' => ($post_data->profileType == 'doctor')?2:(($post_data->profileType == 'patient')?3:0),
            );

            if(!empty($myDataMobile = $this->authentication_model->is_mobile_exist($post_data->mobile))) 
            {
                $this->response(array(
                    'status' => false,
                    'code' => $this->config->item('custom_error_code'),
                    'message' => $this->lang->line('mobile_exists'),
                    'data' => $userData,
                ), parent::HTTP_OK);
            }
            elseif(!empty($myDataEmail = $this->authentication_model->is_email_exist($post_data->email))) 
            {
                $this->response(array(
                    'status' => false,
                    'code' => $this->config->item('custom_error_code'),
                    'message' => $this->lang->line('email_exists'),
                    'data' => $userData,
                ), parent::HTTP_OK);
            }
            else
            {
                if($userId = $this->authentication_model->insert_user($userData))
                {
                    if($userData['profile_type'] == 2)
                    {
                        $doctorData = array(
                            'department_id' => (!is_null($departmentId = $this->validate_model->_getDepartmentIdByCode($post_data->department)))?$departmentId:0,
                            'added_by_id' => (isset($post_data->addedById))?trim($post_data->addedById):1,
                            'user_id' => $userId,
                            'is_active' => 1,
                            'created_at' => date('Y-m-d H:i:s')
                        );

                        if($doctorId = $this->authentication_model->insertDoctor($doctorData))
                        {
                            $userDetails = $this->authentication_model->verifyUser($userId,'user_id');
                            $userData = $this->serialize_models->getSerializeUserData($userDetails,'normal');
                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message'=> $this->lang->line('registration_success_message'),
                                'data' => $userData
                            ), parent::HTTP_OK);
                        }
                        else
                        {
                            $this->response(array(
                                'status' => false,                    
                                'code' => $this->config->item('custom_error_code'),
                                'message'=> $this->lang->line('registration_fail_message'),
                                'data' => array(),
                            ), parent::HTTP_OK);
                        }
                    }
                    elseif($userData['profile_type'] == 3)
                    {
                        $patientData = array(
                            'cr_number' => uniqid('CRN'),
                            'added_by_id' => (isset($post_data->addedById))?trim($post_data->addedById):0,
                            'user_id' => $userId,
                            'is_active' => 1,
                            'created_at' => date('Y-m-d H:i:s')
                        );
                        if($patientId = $this->authentication_model->insertPatient($patientData))
                        {
                            $userDetails = $this->authentication_model->verifyUser($userId,'user_id');
                            $userData = $this->serialize_models->getSerializeUserData($userDetails,'normal');
                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message'=> $this->lang->line('registration_success_message'),
                                'data' => $userData
                            ), parent::HTTP_OK);
                        }
                        else
                        {
                            $this->response(array(
                                'status' => false,                    
                                'code' => $this->config->item('custom_error_code'),
                                'message'=> $this->lang->line('registration_fail_message'),
                                'data' => array(),
                            ), parent::HTTP_OK);
                        }
                    }
                    else
                    {

                    }
                }
                else
                {
                    $this->response(array(
                        'status' => false,                    
                        'code' => $this->config->item('custom_error_code'),
                        'message'=> $this->lang->line('registration_fail_message'),
                        'data' => array(),
                    ), parent::HTTP_OK);
                }
            }
        }
        else
        {
            $errorMessage = array();
            foreach($post_data as $key => $data)
            {
                if(empty($post_data->$key))
                {                    
                    $errorMessage[] = array($key => 'This Field is required.');
                }
            }

            $this->response(array(
                'status' => false,
                'code' => $this->config->item('custom_error_code'),
                'message' => $this->lang->line('all_fields_required'),
                'data' => $errorMessage,
            ), parent::HTTP_OK);
        }
    }

    function login_POST()
    {
        $post_data = json_decode($this->security->xss_clean($this->input->raw_input_stream));
        
        if (isset($post_data->mobile) && !empty($post_data->mobile) && isset($post_data->password) && !empty($post_data->password) && isset($post_data->profileType) && !empty($post_data->profileType)) 
        {
            if($valueType = checkIsMobileOrEmail($post_data->mobile))
            {                    
                if($valueType == 'Mobile')
                {
                    $input_email = $post_data->mobile;
                    $input_password = $post_data->password;
                    $userDetails = $this->authentication_model->verifyUser($input_email,'mobile');

                    $device_token = (isset($post_data->deviceToken))?trim($post_data->deviceToken):'';
                    $device_type = (isset($post_data->deviceType))?trim($post_data->deviceType):'';

                    if(!empty($userDetails)) 
                    {
                        if(password_verify($input_password, $userDetails->password)) 
                        {
                            $notificationData=array(
                               "device_id"=>$post_data->device_id,
                               "firebase_id"=>$post_data->firebase_id,
                               "deviceType"=>$post_data->deviceType,
                            );

                            $this->authentication_model->setDeviceDetails($userDetails->id,$notificationData);
                            $userData = $this->serialize_models->getSerializeUserData($userDetails,'normal');
                            $loginDataa = array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message' => $this->lang->line('login_success_message'),
                                'data' => $userData,
                            );                                
                            $this->response($loginDataa, parent::HTTP_OK);
                        }
                        else
                        {
                            $this->response(array(
                                'status' => false,
                                'code' => $this->config->item('custom_error_code'),
                                'message' => $this->lang->line('invalid_password_message'),
                            ), parent::HTTP_OK);
                        }
                    }
                    else
                    { 
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message'=> $this->lang->line('mobile_notExists_message')
                        ), parent::HTTP_OK);

                    }
                }
                else
                {
                    $this->response(array(
                        'status' => false,                    
                        'code' => $this->config->item('custom_error_code'),
                        'message'=> 'Please Enter a Valid Mobile Number.'
                    ), parent::HTTP_OK);
                }
            } 
        }
        else
        {
            $this->response(array(
                'status' => false,
                'code' => $this->config->item('custom_error_code'),
                'message'=> $this->lang->line('all_fields_required')
            ), parent::HTTP_OK);
        }
    }
    

    //Check Identifier....
    function userTypeValue_POST()
    {
        $post_data = json_decode($this->security->xss_clean($this->input->raw_input_stream));
        if (isset($post_data->userValue) && !empty($post_data->userValue)) 
        {
            $value=substr($post_data->userValue,0,2);
            if($value=='CR')
            {
                $userDetails = $this->authentication_model->verifyUserType($post_data->userValue,'CR');
                if(!empty($userDetails)) 
                    {
                        
                        $userData = $this->serialize_models->getSerializeUserData($userDetails,'normal');
                        $loginDataa = array(
                            'status' => true,
                            'code' => $this->config->item('success_code'),
                            'message' => $this->lang->line('login_success_message'),
                            'data' => $userData,
                        );                                
                        $this->response($loginDataa, parent::HTTP_OK);
                        
                    }
                    else
                    { 
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message'=> 'User not found'
                        ), parent::HTTP_OK);

                    }
            }
            else if($value=='DR')
            {
                $userDetails = $this->authentication_model->verifyUserType($post_data->userValue,'DR');
                if(!empty($userDetails)) 
                    {
                       
                        $userData = $this->serialize_models->getSerializeUserData($userDetails,'normal');
                        $loginDataa = array(
                            'status' => true,
                            'code' => $this->config->item('success_code'),
                            'message' => $this->lang->line('login_success_message'),
                            'data' => $userData,
                        );                                
                        $this->response($loginDataa, parent::HTTP_OK);
                        
                    }
                    else
                    { 
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message'=> 'User not found'
                        ), parent::HTTP_OK);

                    }
            }
            else
            {
                $this->response(array(
                    'status' => false,
                    'code' => $this->config->item('custom_error_code'),
                    'message' => 'Invalid value',
                ), parent::HTTP_OK);
            }
        }
        else
        {
            $this->response(array(
                'status' => false,
                'code' => $this->config->item('custom_error_code'),
                'message'=> $this->lang->line('all_fields_required')
            ), parent::HTTP_OK);
        }
    }
}
