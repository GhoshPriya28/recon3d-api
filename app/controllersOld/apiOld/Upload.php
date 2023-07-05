<?php
defined('BASEPATH') OR exit('No direct script access allowed');
require (APPPATH.'libraries/REST_Controller.php');
header("Access-Control-Allow-Origin: * ");
header("Access-Control-Allow-Methods: POST, GET");
class Upload extends REST_Controller 
{

    public function __construct()
    {
        parent::__construct();
        $this->load->model(['api/validate_model']);
        $this->load->helper(array('authorization','jwt','upload'));
        $this->load->library(['form_validation','upload_documents']);
        $this->read_db = $this->load->database('read_db', true);
    }

    // Upload File
    function uploadFiles_POST()
    {
        try
        {            
            $this->form_validation->set_rules('crNumber', 'CR Number', 'trim|required|xss_clean');
            if (!$this->form_validation->run())
            {
                $validationArray=array('crNumber');
                foreach ($validationArray as $order => $field_name) {    
                    $data[$field_name] = form_error($field_name,' ',' ');
                }

                $this->response(array(
                    'status' => false,
                    'code' => $this->config->item('custom_error_code'),
                    'message' => 'The CR Number field is required.',
                    'data' => ''
                ), parent::HTTP_OK);
            }
            else
            {
                if($this->form_validation->set_value('crNumber'))
                {
                    $path = './attachments/'.$this->form_validation->set_value('crNumber');
                    $type = 'pdf|doc|docx|png|jpeg|jpg';
                    $maxSize = '51200';
                    $originalPath = 'attachments/'.$this->form_validation->set_value('crNumber').'/';
                }
                
                if(!is_dir($path))
                {
                  mkdir($path,0755,TRUE);
                }

                $output = $this->upload_documents->run([
                    'field_name'    => 'fileToUpload', // Field Name
                    'upload_path'   => $path, // Upload Path
                    'allowed_types' => $type, // File Types
                    'max_size' => $maxSize, // Maximum File Size (KB),
                    'encrypt_name' => true,
                    'original_path' => $originalPath,
                ]);

                if($output['status'] == TRUE)
                {
                    $this->response(array(
                        'status' => true,
                        'code' => $this->config->item('success_code'),
                        'message'=> $this->lang->line('uploaded_success_message'),
                        'data' => $output['data']
                    ), parent::HTTP_OK);
                }
                else
                {
                    $this->response(array(
                        'status' => false,
                        'code' => $this->config->item('custom_error_code'),
                        'message' => $output['message'],
                        'data' => ''
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
