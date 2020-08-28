
import pyrebase
import random

config = {
    "apiKey": "AIzaSyCCtm2Zf7Hb6SjKRxwgwVZM5RfD64tODls",
    "authDomain": "home-automation-80eec.firebaseapp.com",
    "databaseURL": "https://home-automation-80eec.firebaseio.com",
    "projectId": "home-automation-80eec",
    "storageBucket": "home-automation-80eec.appspot.com",
    "messagingSenderId": "970359498290",
    "appId": "1:970359498290:web:a43e83568b9db8eb783e2b",
    "measurementId": "G-YTRZ79TCJJ"
  }

class FireDatabase():
		def __init__(self):
			self.firebase = pyrebase.initialize_app(config)
			self.auth = self.firebase.auth()
			self.db = self.firebase.database()
			self.logged_user = User(self)

		def login_user(self, uname, pwd):
			return self.logged_user.login(uname, pwd)  

		def get_user_info(self):
			return self.logged_user.get_user_info()  
            
		def get_user_id(self):
			return self.logged_user.get_user_id()   
		
		def init_db(self):
			self.logged_user.init_db()
			return
			
		def get_rooms(self):
			return self.logged_user.get_rooms()
			
		def get_rules(self):
			return self.logged_user.get_rules()
			
		def get_scenes(self):
			return self.logged_user.get_scenes()
            
		"""def get_user_buildings_ids(self):
			return self.logged_user.get_buildings_ids() 
            
		def get_user_building_count(self):
			return len(self.logged_user.get_buildings_ids())"""   
              
		def set_value_of_OUT(self, val, addr): 	
			self.logged_user.set_value_of_OUT(val, addr)  
			return
			
		def set_state_of_rule(self, rule_name, active): 	
			self.logged_user.set_state_of_rule(rule_name, active)  
			return
			
		def get_user_rooms_stream(self, callback, room_name):
			return self.logged_user.get_user_rooms_stream(callback, room_name) 
			
		def get_user_rules_stream(self, callback, rule_name):        
			return self.logged_user.get_user_rules_stream(callback, rule_name) 
			
class User():
	def __init__(self, fb):
		self.fb = fb
		self.logged_in = False
		self.user_info = None
		self.idToken = None
		self.all_info = None
		self.uid = None
		self.building_id = None
		self.rules = []
		self.scenes = []
		self.rooms = []
		random.seed(15)
    
    #function to login user and retrieve data from database (rules, scenes, rooms)
	def login(self, username, pwd):
		try:
			self.user_info = self.fb.auth.sign_in_with_email_and_password(username, pwd)
			self.idToken = self.user_info['idToken']
			self.all_info = self.fb.auth.get_account_info(self.idToken)['users'][0]
			self.uid = self.all_info['localId']
            
			self.building_id = self.fb.db.child("users").child(self.uid).get(self.idToken).val()
			self.init_db()
			
		except Exception as e:
			if("EMAIL_NOT_FOUND" in str(e)):
				return "EMAIL_NOT_FOUND"
			elif("INVALID_PASSWORD" in str(e)):
				return "INVALID_PASSWORD"
			elif("INVALID_EMAIL" in str(e)):
				return "INVALID_EMAIL"
			elif("USER_DISABLED" in str(e)):
				return "USER_DISABLED"
			else:
				return str(e)#"UNKNOWN_ERROR"
		else:
			self.logged_in = True
			return "SUCCESS"
            
	def init_db(self):
		self.rules = []
		self.scenes = []
		self.rooms = []
			
		self.rules = self.fb.db.child("buildings").child(self.building_id).get(self.idToken).val()["rules"]
		self.scenes = self.fb.db.child("buildings").child(self.building_id).get(self.idToken).val()["scenes"]
		db_r = self.fb.db.child("buildings").child(self.building_id).get(self.idToken).val()["rooms"] 
		
		for r in db_r:
			self.rooms.insert(db_r[r]["index"],({"name" : db_r[r]["name"],"db_name" : r, "devices" : db_r[r]["devices"], "img" : db_r[r]["img"]}))
		#building.append({"db_name":building_db_key,"name":self.buildings_ids[building_db_key],"rooms":rooms})
		#self.buildings.append({"db_name":building_db_key,"name":self.buildings_ids[building_db_key],"rooms":rooms})
 
	def get_user_info(self):
		if(self.logged_in):
			return self.all_user_info
		else:
			return "ERROR"
            
	def get_user_id(self):
		if(self.logged_in):
			return self.uid
		else:
			return "ERROR"
            
	def get_user_token(self):
		if(self.logged_in):
			return self.idToken
		else:
			return "ERROR"
            
	"""def get_buildings_ids(self):
		if(self.logged_in):
			return self.buildings_ids
		else:
			return "ERROR"
        
	def get_buildings(self):
		if(self.logged_in):
			return self.buildings
		else:
			return "ERROR"""
        
	def get_rooms(self):
		if(self.logged_in):
			return self.rooms
		else:
			return "ERROR"
        
	def get_rules(self):
		if(self.logged_in):
			return self.rules
		else:
			return "ERROR"
        
	def get_scenes(self):
		if(self.logged_in):
			return self.scenes
		else:
			return "ERROR"

	def set_value_of_OUT(self, val, addr): 
		self.fb.db.child("buildings").child(self.building_id).child("rooms").child(addr[0]).child("devices").child(addr[1]).child("OUT").child(addr[2]).update({"value": str(val)})

	def set_state_of_rule(self, rule_name, active): 
		self.fb.db.child("buildings").child(self.building_id).child("rules").child(rule_name).update({"active": str(active)})

	def get_user_rooms_stream(self, callback, room_name): 
		return self.fb.db.child("buildings").child(self.building_id).child("rooms").child(room_name).stream(callback, self.idToken)

	def get_user_rules_stream(self, callback, rule_name): 
		return self.fb.db.child("buildings").child(self.building_id).child("rules").child(rule_name).stream(callback, self.idToken)
