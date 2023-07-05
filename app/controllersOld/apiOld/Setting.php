<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require (APPPATH.'libraries/REST_Controller.php');
header("Access-Control-Allow-Origin: * ");
header("Access-Control-Allow-Methods: POST, GET");
class Setting extends REST_Controller 
{

	public function __construct()
    {
		parent::__construct();
        $this->load->model(['api/setting_model','api/validate_model']);
		$this->load->helper(array('authorization','jwt','common'));
        $this->load->library(['otp']);
        $this->read_db = $this->load->database('read_db', true);
	}
	
	// forgotPassword
    function forgotPassword_POST()
    {
        $post_data = json_decode($this->security->xss_clean($this->input->raw_input_stream));
        if (isset($post_data->username) && !empty($post_data->username)) 
        {           
            if($valueType = checkIsMobileOrEmail($post_data->username))
            {                
                if($valueType == 'Mobile')
                {
                    if (!is_null($user = $this->validate_model->__check_userExistsByMobile($post_data->username)))
                    {
                        $otp = $this->otp->__generateOTPForMobile($post_data->username);
                        if($otp === true)
                        {
                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message'=> $this->lang->line('otp_success_message')
                            ), parent::HTTP_OK);
                        }
                        else
                        {
                            $this->response(array(
                                'status' => false,
                                'code' => $this->config->item('custom_error_code'),
                                'message'=> $this->lang->line('otp_fail_message')
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
                elseif($valueType == 'Email')
                {
                    if(!is_null($user = $this->validate_model->__check_userExistsByEmail($post_data->username)))
                    {
                        $otp = $this->otp->__generateOTP($post_data->username);
                        if($otp == true)
                        {
                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message'=> $this->lang->line('otp_success_message')
                            ), parent::HTTP_OK);
                        }
                        else
                        {
                            $this->response(array(
                                'status' => false,
                                'code' => $this->config->item('custom_error_code'),
                                'message'=> $this->lang->line('otp_fail_message')
                            ), parent::HTTP_OK);
                        }
                    }
                    else
                    {
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message'=> $this->lang->line('email_notExists_message')
                        ), parent::HTTP_OK);
                    }
                }
                else
                {
                    $this->response(array(
                        'status' => false,                    
                        'code' => $this->config->item('custom_error_code'),
                        'message'=> 'Please Enter a Valid Mobile.'
                    ), parent::HTTP_OK);
                } 
            }
        }
        else
        {
            $this->response(array(
                'status' => false,
                'code' => $this->config->item('custom_error_code'),
                'message'=> 'Please Enter a Valid Mobile.'
            ), parent::HTTP_OK);
        }
    }

    function resetPassword_POST()
    {
        $post_data = json_decode($this->security->xss_clean($this->input->raw_input_stream));

        if(isset($post_data->username) && !empty($post_data->username) && isset($post_data->newPassword) && !empty($post_data->newPassword))
        {
            if($valueType = checkIsMobileOrEmail($post_data->username))
            {
                if($valueType == 'Mobile')
                {
                    if (!is_null($user = $this->validate_model->__check_userExistsByMobile($post_data->username)))
                    {
                        $newPassword = password_hash($post_data->newPassword, PASSWORD_DEFAULT);
                        $mobile = $post_data->username;
                        
                        $updateData = array('password' => $newPassword);
                        $query = $this->setting_model->updatePassword($mobile,$updateData,'mobile');
            
                        if($query === true)
                        {
                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message'=> $this->lang->line('password_change_message')
                            ), parent::HTTP_OK);
                        }
                        else
                        {
                            $this->response(array(
                                'status' => false,
                                'code' => $this->config->item('custom_error_code'),
                                'message'=> $this->lang->line('password_NotChange_message')
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
                elseif($valueType == 'Email')
                {
                    if(!is_null($user = $this->validate_model->__check_userExistsByEmail($post_data->username)))
                    {
                        $newPassword = password_hash($post_data->newPassword, PASSWORD_DEFAULT);
                        $email = $post_data->username;
            
                        $updateData = array('password' => $newPassword);
                        $query = $this->setting_model->updatePassword($email,$updateData,'email');
            
                        if($query === true)
                        {
                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message'=> $this->lang->line('password_change_message')
                            ), parent::HTTP_OK);
                        }
                        else
                        {
                            $this->response(array(
                                'status' => false,
                                'code' => $this->config->item('custom_error_code'),
                                'message'=> $this->lang->line('password_NotChange_message')
                            ), parent::HTTP_OK);
                        }
                    }
                    else
                    {
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message'=> $this->lang->line('email_notExists_message')
                        ), parent::HTTP_OK);
                    }
                }
                else
                {
                    $this->response(array(
                        'status' => false,                    
                        'code' => $this->config->item('custom_error_code'),
                        'message'=> 'Please Enter a Valid Email/Mobile.'
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

    function resendOtp_POST()
    {
        $post_data = json_decode($this->security->xss_clean($this->input->raw_input_stream));
        if (isset($post_data->username) && !empty($post_data->username)) 
        {            
            if($valueType = checkIsMobileOrEmail($post_data->username))
            {
                if($valueType == 'Email')
                {
                    $otp = $this->otp->__generateOTP($post_data->username);
                    if($otp == true)
                    {
                        $this->response(array(
                            'status' => true,
                            'code' => $this->config->item('success_code'),
                            'message'=> $this->lang->line('otp_success_message')
                        ), parent::HTTP_OK);
                    }
                    else
                    {
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message'=> $this->lang->line('otp_fail_message')
                        ), parent::HTTP_OK);
                    }
                }
                elseif($valueType == 'Mobile')
                {
                    $otp = $this->otp->__generateOTPForMobile($post_data->username);
                    if($otp == true)
                    {
                        $this->response(array(
                            'status' => true,
                            'code' => $this->config->item('success_code'),
                            'message'=> $this->lang->line('otp_success_message')
                        ), parent::HTTP_OK);
                    }
                    else
                    {
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message'=> $this->lang->line('otp_fail_message')
                        ), parent::HTTP_OK);
                    }                      
                }
                else
                {
                    $this->response(array(
                        'status' => false,                    
                        'code' => $this->config->item('custom_error_code'),
                        'message'=> 'Please Enter a Valid Email/Mobile.'
                    ), parent::HTTP_OK);
                } 
            }
            else
            {
                $this->response(array(
                    'status' => false,
                    'code' => $this->config->item('custom_error_code'),
                    'message'=> 'Please Enter a Valid Email/Mobile.'
                ), parent::HTTP_OK);
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
                'message'=> $this->lang->line('all_fields_required'),
                'data' => $errorMessage,
            ), parent::HTTP_OK);
        }
    }
}
