<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require (APPPATH.'libraries/REST_Controller.php');
header("Access-Control-Allow-Origin: * ");
header("Access-Control-Allow-Methods: POST, GET, PUT");
class Profile extends REST_Controller 
{

    public function __construct()
    {
        parent::__construct();
        $this->load->model(['api/profile_model','api/validate_model']);
        $this->load->helper(array('authorization','jwt','common'));
        $this->load->library(['otp','serialize_models']);
        $this->read_db = $this->load->database('read_db', true);
    }

    function profileDetail_GET($userId = 0)
    {
        $token = $this->input->get_request_header('Authorization', TRUE);
        if(isset($userId) && $userId > 0) 
        {
            try
            {
                $userInfo = authorization::validateToken($token);
                if ($userInfo === FALSE) 
                {
                    $this->response(array(
                        'status' => false,
                        'code' => $this->config->item('unauthorized'),
                        'message' => $this->lang->line('unauthorized_access')
                    ), parent::HTTP_UNAUTHORIZED);
                }
                else
                {                    
                    if(!is_null($this->validate_model->__check_userExists($userId)))
                    {
                        if(!is_null($userDetails = $this->profile_model->getUserDetails($userId)))
                        {
                            $profileData = $this->serialize_models->getSerializeUserData($userDetails,'profile');

                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message'=> 'Profile Details.',
                                'data' => $profileData
                            ), parent::HTTP_OK);
                        }
                        else
                        {
                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message' => $this->lang->line('data_Notfound_message'),
                                'data' => new stdClass()
                            ), parent::HTTP_OK); 
                        }
                    }
                    else
                    {
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message' => $this->lang->line('user_not_exists_message')
                        ), parent::HTTP_OK); 
                    }
                    
                }
            }
            catch(Exception $exep)
            {
                $this->response(array(
                    'status' => false,
                    'code' => $this->config->item('internal_error_code'),
                    'message' => $exep->getMessage()
                ), parent::HTTP_INTERNAL_SERVER_ERROR);
            }
        }
        else
        {
            $this->response(array(
                'status' => false,
                'code' => $this->config->item('custom_error_code'),
                'message' => $this->lang->line('empty_userId_message')
            ), parent::HTTP_OK);
        }
    }
    
    // Edit Profile
    function editProfile_PUT()
    {
        $post_data = json_decode($this->security->xss_clean($this->input->raw_input_stream));
        $token = $this->input->get_request_header('Authorization', TRUE);
        try
        {
            $userInfo = authorization::validateToken($token);
            if ($userInfo === FALSE) 
            {
                $this->response(array(
                    'status' => false,
                    'code' => $this->config->item('unauthorized'),
                    'message' => $this->lang->line('unauthorized_access')
                ), parent::HTTP_UNAUTHORIZED);
            }
            else
            {
                if(isset($post_data->userId) && !empty($post_data->userId))
                {
                    $userData = array();

                    if(isset($post_data->firstName) && !empty($post_data->firstName))
                    {
                        $userData['first_name'] = trim($post_data->firstName);
                    }

                    if(isset($post_data->lastName) && !empty($post_data->lastName))
                    {
                        $userData['last_name'] = trim($post_data->lastName);
                    }

                    if(isset($post_data->gender) && !empty($post_data->gender))
                    {
                        $userData['gender'] = (strcasecmp(trim($post_data->gender),'Male') == 0)?'M':((strcasecmp(trim($post_data->gender),'female') == 0)?'F':'');
                    }

                    if(isset($post_data->address) && !empty($post_data->address))
                    {
                        $userData['address'] = trim($post_data->address);
                    }

                    if(isset($post_data->pincode) && !empty($post_data->pincode))
                    {
                        $userData['pincode'] = trim($post_data->pincode);
                    }                 

                    if(isset($post_data->dob) && !empty($post_data->dob))
                    {
                        $userData['dob'] = trim($post_data->dob);
                    }

                    if(!is_null($verifiedData = $this->validate_model->__check_userExists($post_data->userId)))
                    {
                        if(isset($post_data->mobile) != '' && $verifiedData->mobile != isset($post_data->mobile) && !empty($this->authentication_model->is_mobile_exist(trim($post_data->mobile))))
                        {
                            $this->response(array(
                                'status' => false,
                                'code' => $this->config->item('custom_error_code'),
                                'message'=> $this->lang->line('mobile_exists'),
                            ), parent::HTTP_OK);
                        }
                        elseif(isset($post_data->email) != '' && $verifiedData->email != isset($post_data->email) && !empty($this->authentication_model->is_email_exist(trim($post_data->email))))
                        {
                            $this->response(array(
                                'status' => false,
                                'code' => $this->config->item('custom_error_code'),
                                'message'=> $this->lang->line('email_exists'),
                            ), parent::HTTP_OK);
                        }
                        else
                        {
                            if($this->profile_model->update_profile($userData,$post_data->userId)) 
                            {
                                if(!is_null($userDetails = $this->profile_model->getUserDetails($post_data->userId)))
                                {
                                    $userData = $this->serialize_models->getSerializeUserData($userDetails,'profile');
                                }
                                else
                                {
                                    $userData = new  stdClass();
                                }
                                $this->response(array(
                                    'status' => true,
                                    'code' => $this->config->item('success_code'),
                                    'message' => $this->lang->line('profile_updated_message'),
                                    'data' => $userData
                                ), parent::HTTP_OK);
                            }
                            else
                            {
                                $this->response(array(
                                    'status' => false,
                                    'code' => $this->config->item('custom_error_code'),
                                    'message' => $this->lang->line('profile_updation_failed_message')
                                ), parent::HTTP_OK); 
                            }
                        }
                    }
                    else
                    {
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message' => $this->lang->line('user_not_exists_message')
                        ), parent::HTTP_OK); 
                    }
                }
                else
                {
                    $this->response(array(
                        'status' => false,
                        'code' => $this->config->item('custom_error_code'),
                        'message' => $this->lang->line('all_fields_required'),
                        'data' => 'User Id is Required.',
                    ), parent::HTTP_OK);
                }    
            }
        }
        catch(Exception $exep)
        {
            $this->response(array(
                'status' => false,
                'code' => $this->config->item('internal_error_code'),
                'message' => $exep->getMessage()
            ), parent::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
