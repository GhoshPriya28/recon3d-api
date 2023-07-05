<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Visit_model extends CI_Model {

    function __construct(){
        parent::__construct();
        $this->visitsTbl = 'user_visits';
        $this->read_db = $this->load->database('read_db', true);      
    }

    public function getAllVisitByCRNumber($departmentId,$crNumber)
    {
        $this->read_db->select('*');
        $this->read_db->from($this->visitsTbl);
        $this->read_db->join('visit_medication','user_visits.visit_id = visit_medication.visit_id');
        $this->read_db->where("department_id", $departmentId);
        $this->read_db->where("cr_number", $crNumber);
        $query = $this->read_db->get();
        //echo $this->read_db->last_query();
        if($query->num_rows() > 0)
        {
            return $query->result();
        }
        else
        {
            return NULL;
        }
    }

    public function getAllVisitByCR($p_id)
    {
        $this->read_db->select('*');
        $this->read_db->from($this->visitsTbl);
        $this->read_db->join('visit_medication','user_visits.visit_id = visit_medication.visit_id');
        $this->read_db->where("cr_number", $p_id);
        $this->read_db->where("user_visits.parent_id", '0');
        $query = $this->read_db->get();
        //echo $this->read_db->last_query();
        if($query->num_rows() > 0)
        {
            return $query->result();
        }
        else
        {
            return NULL;
        }
    }

    public function getAllVisitByDR($departmentId,$doc_id)
    {
        $this->read_db->select('*');
        $this->read_db->from($this->visitsTbl);
        $this->read_db->join('visit_medication','user_visits.visit_id = visit_medication.visit_id');
        $this->read_db->where("department_id", $departmentId);
        $this->read_db->where("doctor_id", $doc_id);
        $this->read_db->where("user_visits.parent_id", '0');
        $query = $this->read_db->get();
        //echo $this->read_db->last_query();
        if($query->num_rows() > 0)
        {
            return $query->result();
        }
        else
        {
            return NULL;
        }
    }

    public function getChild($visit_id)
    {
        $this->read_db->select('*');
        $this->read_db->from($this->visitsTbl);
        //$this->read_db->join('visit_medication','user_visits.visit_id = visit_medication.visit_id');
        $this->read_db->where("parent_id", $visit_id);
        
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

    public function getChildMedication($visit_id)
    {
        $this->read_db->select('*');
        $this->read_db->from('visit_medication');
        //$this->read_db->join('visit_medication','user_visits.visit_id = visit_medication.visit_id');
        $this->read_db->where("visit_id", $visit_id);
        
        $query = $this->read_db->get();
        //echo $this->read_db->last_query();
        if($query->num_rows() > 0)
        {
            return $query->row();
        }
        else
        {
            return NULL;
        }
    }
    

    public function getAllVisitByUserId($userId)
    {
        $this->read_db->select('*');
        $this->read_db->from($this->visitsTbl);
        $this->read_db->join('visit_medication','user_visits.visit_id = visit_medication.visit_id');
        $this->read_db->where("patient_id", $userId);
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

    public function insertVisitData($visitData)
    {     
        $this->db->insert($this->visitsTbl, $visitData);
        $insert_id = $this->db->insert_id();
        return $insert_id;
    }

    public function insertMedicationData($medicationData)
    {     
        $this->db->insert('visit_medication', $medicationData);
        $insert_id = $this->db->insert_id();
        return $insert_id;
    }

    public function getVisitDetailById($visitId)
    {
        $this->read_db->select('*');
        $this->read_db->from($this->visitsTbl);
        $this->read_db->join('visit_medication','user_visits.visit_id = visit_medication.visit_id');
        $this->read_db->where("visit_code", $visitId);
        $query = $this->read_db->get();
        //echo $this->read_db->last_query();
        if($query->num_rows()>0)
        {
            return $query->result();
        }
        else
        {
            return NULL;
        }
    }

    public function getDepartmentById($id)
    {
        $this->read_db->select('*');
        $this->read_db->from('user_department');
        
        $this->read_db->where("id", $id);
        $query = $this->read_db->get();
        if($query->num_rows() > 0)
        {
            return $query->row();
        }
        else
        {
            return NULL;
        }
    }

    public function getMedication($id)
    {
        $this->read_db->select('*');
        $this->read_db->from('user_department');
        
        $this->read_db->where("visit_id", $id);
        $query = $this->read_db->get();
        if($query->num_rows() > 0)
        {
            return $query->row();
        }
        else
        {
            return NULL;
        }
    }




    public function updateVisitStatus($visit_id,$data)
    {
        //print_R($data);
        $this->read_db->where('visit_id', $visit_id);
        
        $update = $this->read_db->update($this->visitsTbl, $data);
        //echo $this->read_db->last_query();
        return $update?true:false;
    }

    public function updateVisitStatus1($p_id,$data)
    {
       
        $this->read_db->where('parent_id', $p_id);
        
        $update = $this->read_db->update($this->visitsTbl, $data);
         //echo $this->read_db->last_query();
        return $update?true:false;
    }
    

    public function getParent()
    {
        $this->read_db->select_max('parent_id');
        /*$this->read_db->where('department_id', $dep_id);
        $this->read_db->where('patient_id', $p_id);
        $this->read_db->where('doctor_id', $doc_id);*/
        $this->read_db->from($this->visitsTbl);
 
        $query = $this->read_db->get();
        //echo $this->read_db->last_query();
        if($query->num_rows() > 0)
        {
            return $query->row();
        }
        else
        {
            return NULL;
        }
    }

    public function getParentByID($dep_id,$doc_id,$p_id)
    {
        $this->read_db->select('parent_id');
        $this->read_db->where('department_id', $dep_id);
        $this->read_db->where('patient_id', $p_id);
        $this->read_db->where('doctor_id', $doc_id);
        $this->read_db->from($this->visitsTbl);
 
        $query = $this->read_db->get();
        //echo $this->read_db->last_query();
        if($query->num_rows() > 0)
        {
            return $query->row();
        }
        else
        {
            return NULL;
        }
    }







}
