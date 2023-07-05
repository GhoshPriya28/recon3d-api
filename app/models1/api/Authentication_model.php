<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Authentication_model extends CI_Model {

    function __construct(){
        parent::__construct();
        $this->userTbl = 'user_user';
        $this->doctorTbl = 'user_doctor';
        $this->patientTbl = 'user_patient';
        $this->read_db = $this->load->database('read_db', true);      
    }

    public function insert_user($user_data)
    {     
        $this->db->insert($this->userTbl, $user_data);
        $insert_id = $this->db->insert_id();
        return $insert_id;
    }

    public function insertDoctor($user_data)
    {     
        $this->db->insert('user_doctor', $user_data);
        $insert_id = $this->db->insert_id();
        return $insert_id;
    }

    public function insertPatient($user_data)
    {     
        $this->db->insert('user_patient', $user_data);
        $insert_id = $this->db->insert_id();
        return $insert_id;
    }

    public function is_email_exist($email, $user_id='')
    {
        $sql_frm="SELECT id FROM ".$this->userTbl." WHERE 1=1 AND CAST(email As CHAR)='".$email."'";  
        if (!empty($user_id)) 
        {
            $sql_frm=$sql_frm." AND id<>$user_id";
        } 
        $result=$this->db->query($sql_frm)->row();
        return $result;
    }

    public function is_username_exist($username, $user_id='')
    {
        $sql_frm="SELECT id FROM ".$this->userTbl." WHERE 1=1 AND CAST(username As CHAR)='".$username."'";  
        if (!empty($user_id)) 
        {
            $sql_frm=$sql_frm." AND id<>$user_id";
        } 
        $result=$this->db->query($sql_frm)->row();
        return $result;
    }

    public function is_mobile_exist($phone, $user_id='')
    {
        $sql_frm="SELECT id FROM ".$this->userTbl." WHERE 1=1 AND CAST(mobile As CHAR)='".$phone."'";  
        if (!empty($user_id)) 
        {
            $sql_frm=$sql_frm." AND id<>$user_id";
        } 
        $result=$this->db->query($sql_frm)->row();
        return $result;
    }

    public function verifyUser($email,$type)
    {
        $this->read_db->select('id');
        $this->read_db->from($this->userTbl);
        if($type == 'email')
        {
            $this->read_db->where('email', $email);
        }
        if($type == 'mobile')
        {
            $this->read_db->where('mobile', $email);
        }
        if($type == 'user_id')
        {
            $this->read_db->where('id', $email);
        }
        $user=$this->read_db->get()->row();
        if(!empty($user))
        {
            $this->read_db->select("*");
            $this->read_db->from($this->userTbl);
            $this->read_db->where('id', $user->id);
            $query=$this->read_db->get();
            return $query->row();
        }
        return FALSE;
    }

    public function is_social_exist($socialId,$columnName)
    {
        if($columnName == 'google')
        {
             $sql_frm="SELECT * FROM ".$this->userTbl." WHERE CAST(google_social_id As CHAR)='".$socialId."'";
        }
        if($columnName == 'facebook')
        {
            $sql_frm="SELECT * FROM ".$this->userTbl." WHERE CAST(facebook_social_id As CHAR)='".$socialId."'";
        }
        if($columnName == 'apple')
        {
            $sql_frm="SELECT * FROM ".$this->userTbl." WHERE CAST(apple_social_id As CHAR)='".$socialId."'";
        }
        $result=$this->db->query($sql_frm)->row();
        return $result;
    }

    public function insert_social_details($social_data)
    {
        $result=$this->db->insert($this->userTbl, $social_data);
        return $result;        
    }

    public function update_social_details($token_data, $socialId, $columnName, $email=NULL)
    {
        if($email!='')
        {
            $this->db->where('email', $email);
        }
        else
        {
            if($columnName == 'google')
            {
                $this->db->where('google_social_id', $socialId);
            }
            if($columnName == 'facebook')
            {
                $this->db->where('facebook_social_id', $socialId);
            }
            if($columnName == 'apple')
            {
                $this->db->where('apple_social_id', $socialId);
            }
        }
        return $this->db->update($this->userTbl, $token_data);
    }
    
    public function update_user($userData, $user_id)
    {
        $this->read_db->select('id');
        $this->read_db->from($this->userTbl);
        $this->read_db->where('id', $user_id);
        $user = $this->read_db->get()->row();
        if(!empty($user && $userData)){
            $this->db->set($userData);
            $this->db->where('id', $user_id);
            return $this->db->update($this->userTbl);
        }
        return FALSE;        
    }

    public function getSocialDetails($socialId,$columnName)
    {
        $this->read_db->select('id');
        $this->read_db->from($this->userTbl);
        if($columnName == 'google')
        {
            $this->read_db->where('google_social_id', $socialId);
        }
        
        if($columnName == 'facebook')
        {
            $this->read_db->where('facebook_social_id', $socialId);
        }
        
        if($columnName == 'apple')
        {
            $this->read_db->where('apple_social_id', $socialId);
        }
        $user=$this->read_db->get()->row();
        if(!empty($user))
        {
            $this->read_db->select("*");
            $this->read_db->from($this->userTbl);
            $this->read_db->where('id', $user->id);
            $query=$this->read_db->get();
            return $query->row();
        }
        return FALSE;
    }

    function setPassword($id,$data)
    {
        $this->db->where('id', $id);
        $update = $this->db->update($this->userTbl, $data);
        return $update?true:false;
    }

    

    public function verifyUserType($userValue,$type)
    {
        $this->read_db->select('user_id');
        
        if($type == 'CR')
        {
            $this->read_db->from($this->patientTbl);
            $this->read_db->where('cr_number', $userValue);
        }
        else if($type == 'DR')
        {
            $this->read_db->from($this->doctorTbl);
            $this->read_db->where('dr_number', $userValue);
        }
        else
        {
            $this->read_db->from($this->patientTbl);
            $this->read_db->where('cr_number', $userValue);
        }
        
        $user=$this->read_db->get()->row();
       
        if(!empty($user))
        {
            $this->read_db->select("*");
            $this->read_db->from($this->userTbl);
            $this->read_db->where('id', $user->user_id);
            $query=$this->read_db->get();
            //echo $this->read_db->last_query();
            return $query->row();
        }
        return FALSE;
    }

    function setDeviceDetails($id,$data)
    {
        $this->db->where('id', $id);
        $update = $this->db->update($this->userTbl, $data);
        return $update?true:false;
    }

    public function getUserIdByCrNumber($crNumber)
    {
        $this->read_db->select('user_id');
        $this->read_db->from('user_patient');
        $this->read_db->where('cr_number', $crNumber);
        $user=$this->read_db->get()->row();
        //echo $this->read_db->last_query();
        if(!empty($user)){
            return $user->user_id;
        }
        return FALSE;        
    }

    public function getUserIdByDrNumber($crNumber)
    {
        $this->read_db->select('user_id');
        $this->read_db->from('user_doctor');
        $this->read_db->where('dr_number', $crNumber);
        $user=$this->read_db->get()->row();
        
        if(!empty($user)){
            return $user->user_id;
        }
        return FALSE;    
    }

    //Check cr number exist..
    public function is_cr_num_exist($cr)
    {
         $sql_frm="SELECT * FROM user_visits WHERE cr_number='".$cr."'";  
        
        $result=$this->db->query($sql_frm)->row();
        //echo $this->db->last_query();
        return $result;
    }

    public function is_cr_num_exist_user($cr)
    {
        $sql_frm="SELECT * FROM user_patient WHERE cr_number='".$cr."'";  
        
        $result=$this->db->query($sql_frm)->row();

        return $result;
    }


}
