
import kivy 
from kivy.app import App 

from kivy.uix.label import Label
from kivy.uix.gridlayout import GridLayout
from kivy.uix.image import Image
from kivy.uix.button import Button
from kivy.uix.dropdown import DropDown
from kivy.uix.widget import Widget
from kivy.uix.spinner import Spinner
from kivy.uix.textinput import TextInput
from kivy.uix.floatlayout import FloatLayout
from kivy.core.window import Window
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.slider import Slider
from kivy.uix.tabbedpanel import TabbedPanel
from kivy.uix.tabbedpanel import TabbedPanelHeader
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.checkbox import CheckBox
from kivy.uix.switch import Switch
from kivy.uix.scrollview import ScrollView

from kivy.graphics.instructions import InstructionGroup

from kivy.animation import Animation

from kivy.graphics import Rectangle, Color 

from .room import RoomOverview
from .manager import RoomManagerScreen

import sys

from functools import partial
from subprocess import check_output
import threading

class HomeScreen(Screen): 
	def __init__(self, m_app, **kwargs):
		super(HomeScreen, self).__init__(**kwargs)
		self.main_app = m_app
		self.load()
			
	def load(self):
		self.layout = FloatLayout(size_hint=(1.0, 1.0))
		self.add_widget(self.layout)
		self.rooms_overviews = []	
		
	def reload_screen(self):
		self.main_app.fb.init_db()
		rooms = self.main_app.fb.get_rooms()
		rules = self.main_app.fb.get_rules()
		scenes = self.main_app.fb.get_scenes()
		
		"""smazat:
		config_file = open(sys.path[0]+"/config_file.txt", 'r') 
		active_building_db_name = config_file.readline().rstrip("\n")
		config_file.close()"""
		
		
		self.tp = TabbedPanel(size_hint=(1.0, 1.0))
		self.tp.tab_height=70
		
		self.th = TabbedPanelHeader(text='Podmínky',size_hint=(1.0, 1.0))
		self.tp.add_widget(self.th)
		self.room_overview_height = 250
		self.room_overview_tab_layout=BoxLayout(orientation='vertical', size_hint=(1.0, None), height=len(rooms)*self.room_overview_height)
		self.rooms_scroll_panel = ScrollView(size_hint=(1, 1))
		self.rooms_scroll_panel.add_widget(self.room_overview_tab_layout)
		
		self.tp.default_tab_text = "Přehled"
		self.tp.default_tab_content = self.rooms_scroll_panel
		
		self.rules_tab_layout=FloatLayout(size_hint=(1.0, 1.0))
		self.th.content = self.rules_tab_layout
		
		self.layout.add_widget(self.tp)
		
		#room overviews
		i = 0
		for room in rooms:
			#ro = RoomOverview(self, room, size_hint=(1, None), pos_hint={"x":0.0},y=(575-i*150), height=150)#,y=(800-250+i*150-46)
			ro = RoomOverview(self, room, size_hint=(1, None), height=self.room_overview_height)#,y=(800-250+i*150-46)
			self.rooms_overviews.append(ro)
			self.room_overview_tab_layout.add_widget(ro)			
			i = i+1
			
		top=FloatLayout(size_hint=(1.0, 0.3), pos_hint={"left":1.0, "top": 1.0})		
		self.vysunovaci_menu = MainMenu(self, size_hint=(None, None),size=(500,1024),pos=(-Window.width+100,0))
		top.add_widget(self.vysunovaci_menu)
		self.menu_btn = Button(text="Menu", pos_hint={"right":1.0, "top": 1.0}, size=(70,(self.tp.tab_height)), size_hint=(None,None),on_press = self.vysunovaci_menu.toggle_menu) 
		top.add_widget(self.menu_btn)
		self.layout.add_widget(top)
		
		#rules
		i = 0
		for rule_name in rules:
			self.rules_tab_layout.add_widget(Rule(rule_name, rules[rule_name], self, size_hint=(1.0, None), height=80, y=(1024-self.tp.tab_height-80-i*80)))			
			i = i+1
			
			
		bottom = BoxLayout(orientation='horizontal', size_hint=(1.0, None),height=150, pos_hint={"left":1.0, "bottom": 1.0})#FloatLayout(size_hint=(1.0, None),height=150, pos_hint={"left":1.0, "bottom": 1.0})
		
		print(scenes)
		
		for scene in scenes:
			print(scene)
			scene_btn = Button(text=scene)
			bottom.add_widget(scene_btn)
			buttoncallback = partial(self.set_scene, scenes[scene])
			scene_btn.bind(on_press=buttoncallback) 
			
		self.layout.add_widget(bottom)		
			
		
		self.update()
		self.rooms_scroll_panel.bind(pos = self.update, size = self.update) 
		self.rules_tab_layout.bind(pos = self.update, size = self.update) 

	def update(self, *args):		
		c=0.35
		self.rooms_scroll_panel.canvas.before.add(Color(c, c, c,1))
		self.rooms_scroll_panel.canvas.before.add(Rectangle(pos=self.rooms_scroll_panel.pos, size=self.rooms_scroll_panel.size))
		
		self.rules_tab_layout.canvas.before.add(Color(c, c, c,1))
		self.rules_tab_layout.canvas.before.add(Rectangle(pos=self.rules_tab_layout.pos, size=self.rules_tab_layout.size))
		
		i=0
		"""for rule in self.rules_tab_layout.children:
			rule.y = (self.rules_tab_layout.height-i*80)
			i += 1"""
			
	def set_scene(self,scene,btn):
				
		print("nastavuji scénu")
		print(scene["scene_rules"])
		for adr in scene["scene_rules"]:
			
			room_name = adr.split(":")[0]
			zarizeni = adr.split(":")[1]
			pin = adr.split(":")[2]
			hodnota = scene["scene_rules"][adr]
			r = None
			for ro in self.rooms_overviews:
				if(ro.room_db_name == room_name):
					r = ro					
			if(r == None):
				continue
			
			device_object = ro.svetla[zarizeni][pin]
			device_object.val=hodnota
			device_object.update_rect()
			device_object.send_value_thread()
			
		return
		print(zarizeni)
		for ro in self.rooms_overviews:
			if(ro.room_db_name == "pokojík"):
				print(ro.svetla)
				print(ro.lamps)
				#ro.svetla[]
				
		pass
class Rule(FloatLayout):  
	def __init__(self, rule_name, rule, homescreen, **kwargs):
		super(Rule, self).__init__(**kwargs)
		self.rule_name = rule_name
		self.rule = rule
		self.homescreen = homescreen
		font=30
		self.name_label = Label(text=rule_name, font_size=font, halign="left", pos=(80, self.pos[1]+10), size=self.size)
		self.name_label.bind(size=self.name_label.setter('text_size'))

		self.checked_box = Image(source=sys.path[0]+"/files/images/checkbox_2.png",pos=self.pos,size=(64,64))

		self.unchecked_box = Image(source=sys.path[0]+"/files/images/checkbox_1.png",pos=self.pos,size=(64,64))
		if(rule["active"] == "1"):
			tex=self.checked_box.texture
		else:
			tex=self.unchecked_box.texture
		self.checkbox = Rectangle(texture=tex, pos=(self.pos[0]+20,self.pos[1]), size_hint=(None, None), size=(50,50))
		self.checked = rule["active"]
		
		
		self.add_widget(self.name_label)
		
		self.bind(pos = self.update_rect, size = self.update_rect) 
		self.update_rect()
		
		#self.start_stream()		
  
	"""def __del__(self): 
		print('Destructor called, Employee deleted.')
		self.close_stream()"""
		
	def update_rect(self, *args):
		self.name_label.pos = (80, self.pos[1]+10)
		self.name_label.size = self.size
		with self.canvas: 
			ig = InstructionGroup() 
			ig.add(Color(1.0, 1.0, 1.0, 1)) 
			ig.add(self.checkbox)	

	def on_touch_down(self, touch):
		if self.collide_point(*touch.pos):
			if(self.checked == "0"):
				self.checked = "1"
				self.checkbox.texture=self.checked_box.texture
			else:
				self.checked = "0"
				self.checkbox.texture=self.unchecked_box.texture
			self.update_rect()			
			send_thread = threading.Thread(target=self.update_rule_thread)
			send_thread.start()
			
	def start_stream(self):
		self.stream = self.homescreen.main_app.fb.get_user_rules_stream(self.rules_update, self.rule_name)
			
	def close_stream(self):
		self.stream.close()
		
	def rules_update(self, msg):
		print("dodelat v Rule")
				
	def update_rule_thread(self):
		self.homescreen.main_app.fb.set_state_of_rule(self.rule_name, self.checked)

class MainMenu(FloatLayout):  
	def __init__(self, home_screen, **kwargs):
		super(MainMenu, self).__init__(**kwargs)
		self.home_screen = home_screen
		self.main_app = home_screen.main_app
		self.box=BoxLayout(orientation="vertical",size_hint=(0.8, 0.6), pos=self.pos, pos_hint={"top":0.9, "x":0.1})
		self.add_widget(self.box)
		
		self.room_manager_btn = Button(text="Spravovat místnosti", size_hint=(1.0, 1.0))
		self.box.add_widget(self.room_manager_btn)
		self.rooms_manager = RoomManagerScreen(self.home_screen, name="rooms_manager")
		self.room_manager_btn.bind(on_press=self.manage_rooms)
		
		self.device_manager_btn = Button(text="Spravovat zařízení", size_hint=(1.0, 1.0))
		self.box.add_widget(self.device_manager_btn)
		self.device_manager_btn.bind(on_press=self.manage_devices)
		
		self.device_manager_btn = Button(text="Spravovat podmínky", size_hint=(1.0, 1.0))
		self.box.add_widget(self.device_manager_btn)
		self.device_manager_btn.bind(on_press=self.manage_conditions)
		
		self.device_manager_btn = Button(text="Spravovat módy", size_hint=(1.0, 1.0))
		self.box.add_widget(self.device_manager_btn)
		self.device_manager_btn.bind(on_press=self.manage_mods)
		
		self.settings_btn = Button(text="Nastavení", size_hint=(1.0, 1.0))
		self.box.add_widget(self.settings_btn)
		self.settings_btn.bind(on_press=self.settings)
		
		self.logout_btn = Button(text="Odhlásit se", size_hint=(1.0, 1.0))
		self.box.add_widget(self.logout_btn)
		self.logout_btn.bind(on_press=self.logout)
		
		self.bind(pos = self.update, size = self.update) 
		self.opened = False
		
		self.ig = InstructionGroup() 
		self.col = Color(0, 0, 0, 0.6)
		self.ig.add(self.col) 	
		self.rect = Rectangle(pos=self.pos, size=self.size)
		self.ig.add(self.rect)
		self.canvas.before.add(self.ig)
		
		self.update(None, None)
		
	def update(self,a,b):
		
		self.box.pos=self.pos
		self.box.size=self.size
		self.rect.pos=self.pos
		self.rect.size=self.size
		
	def toggle_menu(self, btn):
		if(self.opened == True):
			self.opened = False
			anim = Animation(pos=(-Window.width+100, 0), duration=0.5, t='out_back')
			anim.start(self)
			btn.text = "Menu"		
		else:
			self.opened = True
			anim = Animation(pos=(0, 0), duration=0.5, t='out_back')
			anim.start(self)
			btn.text = "Zavřít"
	
	def manage_rooms(self, btn):
		#self.main_app.sm.switch_to(self.rooms_manager, direction="left")
		self.main_app.sm.switch_to(RoomManagerScreen(self.home_screen, name="rooms_manager"), direction="left")
		self.toggle_menu(self.home_screen.menu_btn)
		
	def manage_devices(self, btn):
		print("manage_devices vyresit")
		exit()
		
	def manage_conditions(self, btn):
		print("manage_conditions vyresit")
		exit()
		
	def manage_mods(self, btn):
		print("manage_mods vyresit")
		exit()
		
	def settings(self, btn):
		print("settings vyresit")
		exit()
		
	def logout(self, btn):
		self.main_app.login.pwd_input.text=""
		self.main_app.sm.switch_to(self.main_app.login, direction="right")
		#self.main_app.logout_user()
		#self.home_screen.main_app.fb.auth.getInstance().signOut()
		#authe.signOut()
