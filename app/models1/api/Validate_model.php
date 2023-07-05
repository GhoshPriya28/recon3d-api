<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Validate_model extends CI_Model {

    function __construct(){
        parent::__construct();
        $this->userTbl = 'user_user';
        $this->read_db = $this->load->database('read_db', true);     
        $this->load->helper('common'); 
    }

    function __check_userExists($id)
    {
        $query = $this->read_db->where(array('user_id'=>$id))->get($this->userTbl);
        return ($query->num_rows()==1)?$query->row():NULL;
    }
    
    public function __check_otpAlreadyExisted($email)
    {
        $query = $this->read_db->where(array('email' => $email,'status' => 'pending'))->get('otpverification');
        return ($query->num_rows()==1)?$query->row():NULL;
    }

    public function __check_otpAlreadyExistedForMobile($mobile)
    {
        $query = $this->read_db->where(array('mobile' => $mobile,'status' => 'pending'))->get('otpverification');
        return ($query->num_rows()==1)?$query->row():NULL;
    }

    function __getUserName($id)
    {
        $query = $this->read_db->where(array('user_id'=>$id))->get($this->userTbl);
        if($query->num_rows()==1)
        {
            $data = $query->row();
            $name = $data->first_name.' '.$data->last_name;
            return $name;
        }
        else
        {
            NULL;
        }
    }

    function __getUserId($id)
    {
        $query = $this->read_db->where(array('user_id'=>$id))->get($this->userTbl);
        if($query->num_rows()==1)
        {
            $data = $query->row();
            $id = $data->id;
            return $id;
        }
        else
        {
            NULL;
        }
    }

    function __check_userExistsByEmail($email)
    {
        $query = $this->read_db->where('LOWER(email) =', strtolower($email))->get($this->userTbl);
        return ($query->num_rows()==1)?$query->row():NULL;
    }

    function __check_userExistsByMobile($mobile)
    {
        $query = $this->read_db->where('mobile', $mobile)->get($this->userTbl);
        return ($query->num_rows()==1)?$query->row():NULL;
    }

    function __getUserImage($id)
    {
        $query = $this->read_db->where(array('user_id'=>$id))->get($this->userTbl);
        if($query->num_rows()==1 && $query->row()->profile_image!==NULL)
        {
            if(isWebUrl($query->row()->profile_image) === true)
            {
                return $query->row()->profile_image;
            }
            else
            {
                return base_url('attachments/users/'.$query->row()->profile_image);
            }            
        }
        else
        {
            return base_url('attachments/users/userImage.png');
        }
    }

    function __getUserTypeByUserId($id)
    {
        $query = $this->read_db->where(array('user_id'=>$id))->get($this->userTbl);
        if($query->num_rows()==1)
        {
            return $query->row()->profile_type;
        }
        else
        {
            return NULL;
        }
    }

    public function _getDepartmentIdByCode($deptCode)
    {
        $this->read_db->select('id');
        $this->read_db->from('user_department');
        $this->read_db->where("dept_code", $deptCode);
        $query = $this->read_db->get();
        if($query->num_rows() == 1)
        {
            return $query->row()->id;
        }
        else
        {
            return NULL;
        }
    }

    public function _getUserCodeById($userId)
    {
        $this->read_db->select('user_id');
        $this->read_db->from('user_user');
        $this->read_db->where("id", $userId);
        $query = $this->read_db->get();
        if($query->num_rows() == 1)
        {
            return $query->row()->user_id;
        }
        else
        {
            return NULL;
        }
    }

    function __check_departmentExists($id)
    {
        $query = $this->read_db->where(array('dept_code' => $id))->get('user_department');
        return ($query->num_rows()==1)?$query->row():NULL;
    }

    function __check_visitExists($id)
    {
        $query = $this->read_db->where(array('visit_code' => $id))->get('user_visits');
        return ($query->num_rows()==1)?$query->row():NULL;
    }

    public function _getCrNumberById($userId)
    {
        $this->read_db->select('cr_number');
        $this->read_db->from('user_patient');
        $this->read_db->where("user_id", $userId);
        $query = $this->read_db->get();
        if($query->num_rows() == 1)
        {
            return $query->row()->cr_number;
        }
        else
        {
            return NULL;
        }
    }

    public function _getDOVById($userId)
    {
        $this->read_db->select('date_of_visit');
        $this->read_db->from('user_patient');
        $this->read_db->where("user_id", $userId);
        $query = $this->read_db->get();
        if($query->num_rows() == 1)
        {
            return $query->row()->date_of_visit;
        }
        else
        {
            return NULL;
        }
    }

    public function _getDrNumberById($userId)
    {
        $this->read_db->select('dr_number');
        $this->read_db->from('user_doctor');
        $this->read_db->where("user_id", $userId);
        $query = $this->read_db->get();
        if($query->num_rows() == 1)
        {
            return $query->row()->dr_number;
        }
        else
        {
            return NULL;
        }
    }
}