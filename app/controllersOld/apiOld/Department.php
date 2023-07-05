<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require (APPPATH.'libraries/REST_Controller.php');
header("Access-Control-Allow-Origin: * ");
header("Access-Control-Allow-Methods: POST, GET, DELETE, PUT");
class Department extends REST_Controller 
{

    public function __construct()
    {
        parent::__construct();
        $this->load->model(['api/department_model','api/validate_model']);
        $this->load->helper(array('authorization','jwt','common'));
        $this->read_db = $this->load->database('read_db', true);
    }

    function departmentList_GET()
    {
        $token = $this->input->get_request_header('Authorization', TRUE);
        try
        {
            $userInfo = authorization::validateToken($token);
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
                if($departmentData = $this->department_model->getAllDepartments())
                {
                    foreach ($departmentData as $key => $department)
                    {
                        $finalData = array(
                            "deptCode" => $department->dept_code,
                            "deptName" => $department->dept_name,
                            "isActive" => ($department->is_active == 1)?true:false,
                        );

                        $finalDataa[] = $finalData;
                    }

                    $this->response(array(
                        'status' => true,
                        'code' => $this->config->item('success_code'),
                        'message'=> $this->lang->line('data_found_message'),
                        'departmentData' => $finalDataa
                    ), parent::HTTP_OK);
                }
                else
                {
                    $this->response(array(
                        'status' => true,
                        'code' => $this->config->item('success_code'),
                        'message' => $this->lang->line('data_Notfound_message'),
                        'departmentData' => array()
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
