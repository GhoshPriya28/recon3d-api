<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Setting_model extends CI_Model {

    function __construct(){
        parent::__construct();
        $this->userTbl = 'user_user';
        $this->read_db = $this->load->database('read_db', true);      
    }	

    function updatePassword($field,$data,$type)
    {
        if($type == 'mobile')
        {
            $this->db->where('mobile', $field);
        }

        if($type == 'email')
        {
            $this->db->where('LOWER(email)', strtolower($field));
        }        
        $update = $this->db->update($this->userTbl, $data);
        return $update?true:false;
    }
}
