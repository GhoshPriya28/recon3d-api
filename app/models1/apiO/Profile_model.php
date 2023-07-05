<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Profile_model extends CI_Model {

    function __construct(){
        parent::__construct();
        $this->userTbl = 'user_user';
        $this->read_db = $this->load->database('read_db', true);      
    }

    public function update_profile($userData, $user_id)
    {
        $this->read_db->select('user_id');
        $this->read_db->from($this->userTbl);
        $this->read_db->where('user_id', $user_id);
        $user = $this->read_db->get()->row();
        if(!empty($user && $userData)){
            $this->db->set($userData);
            $this->db->where('user_id', $user_id);
            return $this->db->update($this->userTbl);
        }
        return FALSE;        
    }

    public function getUserDetails($userId)
    {
        $this->read_db->select("*");
        $this->read_db->from($this->userTbl);
        $this->read_db->where('user_id', $userId);
        $query=$this->read_db->get();
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
