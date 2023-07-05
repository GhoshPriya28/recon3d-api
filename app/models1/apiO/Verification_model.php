<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Verification_model extends CI_Model {

    function __construct(){
        parent::__construct();
        $this->otpTbl = 'otpverification';
        $this->read_db = $this->load->database('read_db', true);      
    }	

    public function getVerificationDetails($field,$fieldValue,$status)
    {
        $this->read_db->select('*');
        $this->read_db->from($this->otpTbl);
        $this->read_db->where($field, $fieldValue);
        $this->read_db->where("status", 'pending');
        $query = $this->read_db->get();
        if($query->num_rows() == 1)
        {
            return $query->row();
        }
        else
        {
            return NULL;
        }
    }
}
