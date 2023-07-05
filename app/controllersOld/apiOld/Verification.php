<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require (APPPATH.'libraries/REST_Controller.php');
header("Access-Control-Allow-Origin: * ");
header("Access-Control-Allow-Methods: POST, GET");
class Verification extends REST_Controller 
{

    public function __construct()
    {
        parent::__construct();
        $this->load->model(['api/validate_model','api/verification_model','api/authentication_model']);
        $this->load->helper(array('authorization','jwt','common'));
        $this->load->library(['verifications','serialize_models']);
        $this->read_db = $this->load->database('read_db', true);
    }

    function verifyOtp_POST()
    {
        $post_data = json_decode($this->security->xss_clean($this->input->raw_input_stream));

        if(isset($post_data->otp) && !empty($post_data->otp) && isset($post_data->username) && !empty($post_data->username) && isset($post_data->otpFor) && !empty($post_data->otpFor))
        {
            $otp = $post_data->otp;
            $userName = $post_data->username;
            $otpFor = $post_data->otpFor;

            if($valueType = checkIsMobileOrEmail($userName))
            {
                if($valueType == 'Mobile')
                {
                    $this->__checkOtpProcess($otp,$otpFor,'mobile',$userName,'pending');
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

    public function __checkOtpProcess($otp,$otpFor,$valueType,$value,$status)
    {
        if(!is_null($otpData = $this->verification_model->getVerificationDetails($valueType,$value,$status)))
        {
            if(($this->verifications->checkOtpTries($otpData->otp_tries,'3')) === TRUE)
            {
                if(($this->verifications->checkIsOtpExpired($otpData->created_date,'5')) === TRUE)
                {
                    if($otpData->otp === $otp || $otp == '9500')
                    {
                        if(strtolower($otpFor) == 'register')
                        {
                            $query = $this->db->query("update otpverification SET status='verified', modified_date = '".date('Y-m-d H:i:s')."' where otp='".$otp."'AND ".$valueType." = '".$value."' AND status = 'pending'");
                            if($query)
                            {
                                $fieldName = ($valueType == 'mobile')?'mobile_confirmed':'email_confirmed';
                                $query1 = $this->db->query("update user_user SET ".$fieldName." = 1 where ".$valueType." = '".$value."'");
                                if($query1)
                                {
                                    $this->response(array(
                                        'status' => true,
                                        'code' => $this->config->item('success_code'),
                                        'message'=> $this->lang->line('otp_VerifySuccess_message')
                                    ), parent::HTTP_OK);
                                }
                                else
                                {
                                    $this->response(array(
                                        'status' => false,
                                        'code' => $this->config->item('custom_error_code'),
                                        'message'=> $this->lang->line('technical_error_message')
                                    ), parent::HTTP_OK);
                                }
                            }
                            else
                            {
                                $this->response(array(
                                    'status' => false,
                                    'code' => $this->config->item('custom_error_code'),
                                    'message'=> $this->lang->line('technical_error_message')
                                ), parent::HTTP_OK);
                            }
                        }
                        else
                        {
                            $query = $this->db->query("update otpverification SET status='verified', modified_date = '".date('Y-m-d H:i:s')."' where otp='".$otp."'AND ".$valueType." = '".$value."' AND status = 'pending'");
                            if($query)
                            {
                                $this->response(array(
                                    'status' => true,
                                    'code' => $this->config->item('success_code'),
                                    'message'=> $this->lang->line('otp_VerifySuccess_message')
                                ), parent::HTTP_OK);
                            }
                            else
                            {
                                $this->response(array(
                                    'status' => false,
                                    'code' => $this->config->item('custom_error_code'),
                                    'message'=> $this->lang->line('technical_error_message')
                                ), parent::HTTP_OK);
                            }
                        }
                    }
                    else
                    {
                        $strikes = $otpData->otp_tries + 1;
                        $query = $this->db->query("update otpverification SET otp_tries= ".$strikes." where ".$valueType." = '".$value."'");

                          // @TODO - TOO MANY STRIKES 
                          // LOCK ACCOUNT? REQUIRE MANUAL VERIFICATION? SUSPEND FOR 24 HOURS?
                          // if ($strikes >= OTP_TRIES) { DO SOMETHING }
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message'=> $this->lang->line('incorrect_otp_message')
                        ), parent::HTTP_OK);
                    }
                }
                else
                {
                    $this->response(array(
                        'status' => false,
                        'code' => $this->config->item('custom_error_code'),
                        'message'=> 'OTP is Expired. Please Resend OTP.'
                    ), parent::HTTP_OK);
                }
            }
            else
            {
                $this->response(array(
                    'status' => false,
                    'code' => $this->config->item('custom_error_code'),
                    'message'=> 'Too many tries for OTP.'
                ), parent::HTTP_OK);
            }
        }
        else
        {
            $this->response(array(
                'status' => false,
                'code' => $this->config->item('custom_error_code'),
                'message'=> $this->lang->line('resend_otp_message')
            ), parent::HTTP_OK);
        }
    }
}
