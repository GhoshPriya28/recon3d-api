<?php
defined('BASEPATH') OR exit('No direct script access allowed');
include_once APPPATH . "libraries/vendor/autoload.php";
require (APPPATH.'libraries/REST_Controller.php');
header("Access-Control-Allow-Origin: * ");
header("Access-Control-Allow-Methods: POST, GET");
class Enrollment extends REST_Controller 
{

    public function __construct()
    {
        parent::__construct();
        $this->load->model(['api/authentication_model','api/validate_model']);
        $this->load->helper(array('authorization','jwt','common'));
        $this->load->library(['otp','serialize_models']);
        $this->read_db = $this->load->database('read_db', true);
    }

    public function enrollUser_POST()
    {
        $post_data = json_decode($this->security->xss_clean($this->input->raw_input_stream));
        if (isset($post_data->fullName) && !empty($post_data->fullName) && isset($post_data->email) && isset($post_data->phoneNumber) && !empty($post_data->phoneNumber) && isset($post_data->address) && isset($post_data->age) && !empty($post_data->age) && isset($post_data->gender) && !empty($post_data->gender) && isset($post_data->dov) && !empty($post_data->dov) && isset($post_data->crNumber) && !empty($post_data->crNumber))
        {
            $userData=array(
                'user_id' => uniqid(),
                'first_name' => trim($post_data->fullName),
                'mobile' => trim($post_data->phoneNumber),
                'email' => trim($post_data->email),
                'age' => trim($post_data->age),
                'gender' => ($post_data->gender == 'male')?'M':(($post_data->gender == 'female')?'F':''),
                'address' => $post_data->address,
                'country_code' => '+91',
                'profile_type' => 3,
            );

            // if(!empty($myDataMobile = $this->authentication_model->is_mobile_exist($post_data->phoneNumber))) 
            // {
            //     $this->response(array(
            //         'status' => false,
            //         'code' => $this->config->item('custom_error_code'),
            //         'message' => $this->lang->line('mobile_exists'),
            //         'data' => $userData,
            //     ), parent::HTTP_OK);
            // }
            // elseif(!empty($myDataEmail = $this->authentication_model->is_email_exist($post_data->email))) 
            // {
            //     $this->response(array(
            //         'status' => false,
            //         'code' => $this->config->item('custom_error_code'),
            //         'message' => $this->lang->line('email_exists'),
            //         'data' => $userData,
            //     ), parent::HTTP_OK);
            // }
            // else
            // {
                if($userId = $this->authentication_model->insert_user($userData))
                {
                    if($userData['profile_type'] == 3)
                    {
                        $patientData = array(
                            // 'cr_number' => uniqid('CRN'),
                            'cr_number' => $post_data->crNumber,
                            'added_by_id' => (isset($post_data->addedById))?trim($post_data->addedById):1,
                            'user_id' => $userId,
                            'date_of_visit' => $post_data->dov,
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
                                'message'=> 'Patient Enrollment Completed Successfully.',
                                'data' => $userData
                            ), parent::HTTP_OK);
                        }
                        else
                        {
                            $this->response(array(
                                'status' => false,                    
                                'code' => $this->config->item('custom_error_code'),
                                'message'=> 'Something Went Wrong.',
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
                        'message'=> 'Something Went Wrong.',
                        'data' => array(),
                    ), parent::HTTP_OK);
                }
            // }
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
}
