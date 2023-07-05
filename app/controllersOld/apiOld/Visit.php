<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require (APPPATH.'libraries/REST_Controller.php');
header("Access-Control-Allow-Origin: * ");
header("Access-Control-Allow-Methods: POST, GET, DELETE, PUT");
class Visit extends REST_Controller 
{

    public function __construct()
    {
        parent::__construct();
        $this->load->model(['api/visit_model','api/validate_model','api/authentication_model']);
        $this->load->helper(array('authorization','jwt','common'));
        $this->load->library(['otp','serialize_models']);
        $this->read_db = $this->load->database('read_db', true);
    }

    // Visit List 
    function visitList_GET()
    {
        $token = $this->input->get_request_header('Authorization', TRUE);
        try
        {
            // $userInfo = authorization::validateToken($token);
            // if ($userInfo === FALSE) 
            // {
            //     $this->response(array(
            //         'status' => false,
            //         'code' => $this->config->item('unauthorized'),
            //         'message' => $this->lang->line('unauthorized_access')
            //     ), parent::HTTP_UNAUTHORIZED);
            // }
            // else
            // {
                $departmentId = $this->input->get('departmentId');
                $crNumber = $this->input->get('crNumber');
                $visitType=$this->input->get('visitType');
                if(($visitType=='doctor') && ($crNumber!='' && $departmentId!=''))
                {
                    if(!is_null($this->validate_model->__check_departmentExists($departmentId)))
                    {
                        $deptId = $this->validate_model->_getDepartmentIdByCode($departmentId);
                        $userId = $this->authentication_model->getUserIdByDrNumber($crNumber);
                        if($userId)
                        {
                            $userDetails = $this->authentication_model->verifyUser($userId,'user_id');
                            $userData = $this->serialize_models->getSerializeUserData($userDetails,'search');
                            $visitData=array(); 
                            
                            $userDetails = $this->authentication_model->verifyUserType($crNumber,'DR');
                            $visitData = $this->visit_model->getAllVisitByDR($deptId,$userDetails->id);

                           
                            if($visitData)
                            {

                                $i = 1;
                                foreach ($visitData as $key => $visit)
                                {
                                    $finalData = array(
                                        "visitId" => $visit->visit_code,
                                        "visitName" => 'Visit-'.$i,
                                        "doctorId" => (!is_null($doctorId = $this->validate_model->_getUserCodeById($visit->doctor_id)))?$doctorId:'',
                                        "patientId" => (!is_null($patientId = $this->validate_model->_getUserCodeById($visit->patient_id)))?$patientId:'',
                                        "visitDate" => $visit->visit_date,
                                        "medicationJson" => (isset($visit->medication_details))?json_decode($visit->medication_details):new stdClass(),
                                    );

                                    $finalDataa[] = $finalData;
                                    $i++;
                                }
                                 
                                $this->response(array(
                                    'status' => true,
                                    'code' => $this->config->item('success_code'),
                                    'message'=> $this->lang->line('data_found_message'),
                                    'userData' => $userData,
                                    'visitsData' => $finalDataa
                                ), parent::HTTP_OK);
                            }
                            else
                            {
                                $this->response(array(
                                    'status' => true,
                                    'code' => $this->config->item('success_code'),
                                    'message' => $this->lang->line('data_Notfound_message'),
                                    'userData' => array(),
                                    'visitsData' => array()
                                ), parent::HTTP_OK);
                            }
                        }
                        else
                        {
                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message' => $this->lang->line('data_Notfound_message'),
                                'userData' => array(),
                                'visitsData' => array()
                            ), parent::HTTP_OK);
                        }
                        
                    }
                    else
                    {
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message' => 'Oops, this department id does not match our records. Please provide a valid department id.'
                        ), parent::HTTP_OK);
                    }
                     
                }
                else if($visitType=='patient' && $crNumber!='')
                {
                       $userId = $this->authentication_model->getUserIdByCrNumber($crNumber);
                       if($userId)
                       {
                            $userDetails = $this->authentication_model->verifyUser($userId,'user_id');
                            $userData = $this->serialize_models->getSerializeUserData($userDetails,'search');
                            $visitData=array(); 
                            
                            $userDetails = $this->authentication_model->verifyUserType($crNumber,'CR');
                            $visitData = $this->visit_model->getAllVisitByCR($userDetails->id);
                           
                            if($visitData)
                            {

                                $i = 1;
                                foreach ($visitData as $key => $visit)
                                {
                                    $finalData = array(
                                        "visitId" => $visit->visit_code,
                                        "visitName" => 'Visit-'.$i,
                                        "doctorId" => (!is_null($doctorId = $this->validate_model->_getUserCodeById($visit->doctor_id)))?$doctorId:'',
                                        "patientId" => (!is_null($patientId = $this->validate_model->_getUserCodeById($visit->patient_id)))?$patientId:'',
                                        "visitDate" => $visit->visit_date,
                                        "medicationJson" => (isset($visit->medication_details))?json_decode($visit->medication_details):new stdClass(),
                                    );

                                    $finalDataa[] = $finalData;
                                    $i++;
                                }
                                 
                                $this->response(array(
                                    'status' => true,
                                    'code' => $this->config->item('success_code'),
                                    'message'=> $this->lang->line('data_found_message'),
                                    'userData' => $userData,
                                    'visitsData' => $finalDataa
                                ), parent::HTTP_OK);
                            }
                            else
                            {
                                $this->response(array(
                                    'status' => true,
                                    'code' => $this->config->item('success_code'),
                                    'message' => $this->lang->line('data_Notfound_message'),
                                    'userData' => array(),
                                    'visitsData' => array()
                                ), parent::HTTP_OK);
                            }
                       }
                       else
                       {
                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message' => $this->lang->line('data_Notfound_message'),
                                'userData' => array(),
                                'visitsData' => array()
                            ), parent::HTTP_OK);
                       }

                        
                     
                }
                else
                {
                   $this->response(array(
                        'status' => false,
                        'code' => $this->config->item('custom_error_code'),
                        'message' => 'Please provide a valid cr number.'
                    ), parent::HTTP_OK);
                        
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

    // Create Visit
    function createVisit_POST()
    {
        $post_data = json_decode($this->security->xss_clean($this->input->raw_input_stream));
        $token = $this->input->get_request_header('Authorization', TRUE);
        try
        {
            // $userInfo = authorization::validateToken($token);
            // if ($userInfo === FALSE) 
            // {
            //     $this->response(array(
            //         'status' => false,
            //         'code' => $this->config->item('unauthorized'),
            //         'message' => $this->lang->line('unauthorized_access')
            //     ), parent::HTTP_UNAUTHORIZED);
            // }
            // else
            // {
                if(isset($post_data->departmentId) && !empty($post_data->departmentId) && isset($post_data->patientId) && !empty($post_data->patientId) && isset($post_data->crNumber) && !empty($post_data->crNumber) && isset($post_data->visitDate) && !empty($post_data->visitDate)) 
                {
                    // if(!is_null($this->validate_model->__check_userExists($post_data->doctorId)))
                    // {
                        // if(!is_null($this->validate_model->__check_userExists($post_data->patientId)))
                        // {
                            if(!is_null($this->validate_model->__check_departmentExists($post_data->departmentId)))
                            {
                                $visitData = array(
                                    'visit_code' => uniqid(),
                                    'department_id' => (!is_null($departmentId = $this->validate_model->_getDepartmentIdByCode($post_data->departmentId)))?$departmentId:'',
                                    'doctor_id' => (!is_null($doctorId = $this->validate_model->__getUserId($post_data->doctorId)))?$doctorId:'',
                                    'patient_id' => (!is_null($patientId = $this->validate_model->__getUserId($post_data->patientId)))?$patientId:'',
                                    'cr_number' => $post_data->crNumber,
                                    'visit_date' => $post_data->visitDate,
                                );

                                if($query = $this->visit_model->insertVisitData($visitData))
                                {
                                    $medicationData = array(
                                        'medication_code' => uniqid(),
                                        'visit_id' => $query,
                                        'medication_details' => json_encode($post_data->medicationJson)
                                    );

                                    if($medicationQuery = $this->visit_model->insertMedicationData($medicationData))
                                    {
                                        $this->response(array(
                                            'status' => true,
                                            'code' => $this->config->item('success_code'),
                                            'message' => 'Visit Created Successfully.'
                                        ), parent::HTTP_OK);
                                    }
                                    else
                                    {
                                        $this->response(array(
                                            'status' => false,
                                            'code' => $this->config->item('custom_error_code'),
                                            'message' => $this->lang->line('technical_error_message')
                                        ), parent::HTTP_OK); 
                                    }
                                }
                                else
                                {
                                    $this->response(array(
                                        'status' => false,
                                        'code' => $this->config->item('custom_error_code'),
                                        'message' => $this->lang->line('technical_error_message')
                                    ), parent::HTTP_OK); 
                                }
                            }
                            else
                            {
                                $this->response(array(
                                    'status' => false,
                                    'code' => $this->config->item('custom_error_code'),
                                    'message' => 'Oops, this department id does not match our records. Please provide a valid department id.'
                                ), parent::HTTP_OK);
                            }
                        // }
                        // else
                        // {
                        //     $this->response(array(
                        //         'status' => false,
                        //         'code' => $this->config->item('custom_error_code'),
                        //         'message' => 'Oops, this patient id does not match our records. Please provide a valid patient id.'
                        //     ), parent::HTTP_OK);
                        // }
                    // }
                    // else
                    // {
                    //     $this->response(array(
                    //         'status' => false,
                    //         'code' => $this->config->item('custom_error_code'),
                    //         'message' => 'Oops, this doctor id does not match our records. Please provide a valid doctor id.'
                    //     ), parent::HTTP_OK);
                    // }
                }
                else
                {
                    $this->response(array(
                        'status' => false,
                        'code' => $this->config->item('custom_error_code'),
                        'message' => $this->lang->line('all_fields_required')
                    ), parent::HTTP_OK);
                }    
            // }
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

    // Visit List By User Id
    function visits_GET()
    {
        $token = $this->input->get_request_header('Authorization', TRUE);
        try
        {
            // $userInfo = authorization::validateToken($token);
            // if ($userInfo === FALSE) 
            // {
            //     $this->response(array(
            //         'status' => false,
            //         'code' => $this->config->item('unauthorized'),
            //         'message' => $this->lang->line('unauthorized_access')
            //     ), parent::HTTP_UNAUTHORIZED);
            // }
            // else
            // {
                $userId = $this->input->get('userId');

                if(!is_null($this->validate_model->__check_userExists($userId)))
                {
                    $user = $this->validate_model->__getUserId($userId);
                    if($visitData = $this->visit_model->getAllVisitByUserId($user))
                    {
                        foreach ($visitData as $key => $visit)
                        {
                            $finalData = array(
                                "visitId" => $visit->visit_code,
                                "visitName" => 'Visit-'.$visit->visit_date,
                                "doctorId" => (!is_null($doctorId = $this->validate_model->_getUserCodeById($visit->doctor_id)))?$doctorId:'',
                                "patientId" => (!is_null($patientId = $this->validate_model->_getUserCodeById($visit->patient_id)))?$patientId:'',
                                "visitDate" => $visit->visit_date,
                                "medicationJson" => (isset($visit->medication_details))?$visit->medication_details:new stdClass(),
                            );

                            $finalDataa[] = $finalData;
                        }

                        $this->response(array(
                            'status' => true,
                            'code' => $this->config->item('success_code'),
                            'message'=> $this->lang->line('data_found_message'),
                            'visitsData' => $finalDataa
                        ), parent::HTTP_OK);
                    }
                    else
                    {
                        $this->response(array(
                            'status' => true,
                            'code' => $this->config->item('success_code'),
                            'message' => $this->lang->line('data_Notfound_message'),
                            'visitsData' => array()
                        ), parent::HTTP_OK);
                    }
                }
                else
                {
                    $this->response(array(
                        'status' => false,
                        'code' => $this->config->item('custom_error_code'),
                        'message' => 'Oops, this department id does not match our records. Please provide a valid department id.'
                    ), parent::HTTP_OK);
                }
            // }
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

    // Visit Detail By Id
    function visitDetail_GET()
    {
        $token = $this->input->get_request_header('Authorization', TRUE);
        try
        {
            // $userInfo = authorization::validateToken($token);
            // if ($userInfo === FALSE) 
            // {
            //     $this->response(array(
            //         'status' => false,
            //         'code' => $this->config->item('unauthorized'),
            //         'message' => $this->lang->line('unauthorized_access')
            //     ), parent::HTTP_UNAUTHORIZED);
            // }
            // else
            // {
                $visitId = $this->input->get('visitId');

                if(!empty($visitId))
                {
                    if($this->validate_model->__check_visitExists($visitId))
                    {
                        if($visitData = $this->visit_model->getVisitDetailById($visitId))
                        {
                            $finalData = array(
                                "visitId" => $visitData->visit_code,
                                "visitName" => 'Visit-'.$visitData->visit_date,
                                "doctorId" => (!is_null($doctorId = $this->validate_model->_getUserCodeById($visitData->doctor_id)))?$doctorId:'',
                                "patientId" => (!is_null($patientId = $this->validate_model->_getUserCodeById($visitData->patient_id)))?$patientId:'',
                                "visitDate" => $visitData->visit_date,
                                "medicationJson" => (isset($visit->medication_details))?$visit->medication_details:new stdClass(),
                            );

                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message'=> $this->lang->line('data_found_message'),
                                'visitData' => $finalData
                            ), parent::HTTP_OK);
                        }
                        else
                        {
                            $this->response(array(
                                'status' => true,
                                'code' => $this->config->item('success_code'),
                                'message' => $this->lang->line('data_Notfound_message'),
                                'visitData' => new stdClass(),
                            ), parent::HTTP_OK);
                        }
                    }
                    else
                    {
                        $this->response(array(
                            'status' => false,
                            'code' => $this->config->item('custom_error_code'),
                            'message' => 'Oops, this visit id does not match our records. Please provide a valid visit id.'
                        ), parent::HTTP_OK); 
                    }
                }
                else
                {
                    $this->response(array(
                        'status' => false,
                        'code' => $this->config->item('custom_error_code'),
                        'message' => 'Provide a valid visit id.'
                    ), parent::HTTP_OK);
                }
            // }
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
