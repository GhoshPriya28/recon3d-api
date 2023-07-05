<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Department_model extends CI_Model {

    function __construct(){
        parent::__construct();
        $this->departmentTbl = 'user_department';
        $this->read_db = $this->load->database('read_db', true);      
    }

    public function getAllDepartments()
    {
        $this->read_db->select('*');
        $this->read_db->from($this->departmentTbl);
        $this->read_db->where("is_active", '1');
        $this->read_db->order_by("dept_name", 'ASC');
        $query = $this->read_db->get();
        if($query->num_rows() > 0)
        {
            return $query->result();
        }
        else
        {
            return NULL;
        }
    }
}
