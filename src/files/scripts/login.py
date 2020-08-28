
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
from kivy.uix.popup import Popup
from kivy.uix.slider import Slider

from .icon import ShowHideIcon
from .room import RoomOverview
from .home import HomeScreen

import sys
import time
import threading

from kivy.clock import Clock
from functools import partial

#potřebné importy
from subprocess import check_output

class LoginScreen(Screen): 
	def __init__(self, m_app, **kwargs):
		super(LoginScreen, self).__init__(**kwargs)
		#self.wifi_ssid = " (Nejste připojeni!)"
		self.main_app = m_app
		self.load()
                
	def load(self):

		self.layout = FloatLayout()
		
		self.login_label= Label(text="Uživatelské jméno",
						   size_hint=(0.5,0.05),
						   pos_hint={"x":0.0, "top":0.75})

		self.login_input=TextInput(multiline=False, password=False,
						   size_hint=(0.5,0.05),
						   pos_hint={"x":0.25, "top":0.7})
		
		self.pwd_label= Label(text="Heslo:",
						   size_hint=(0.5,0.05),
						   pos_hint={"x":0.0, "top":0.6})

		self.pwd_input=TextInput(multiline=False, password=True,
						   size_hint=(0.5,0.05),
						   pos_hint={"x":0.25, "top":0.55})
		
		self.show_pwd_flag=0
		self.show_pwd_icon = ShowHideIcon(self.show_pwd_flag,self.pwd_input, size_hint=(0.07, 0.05), pos_hint={"x":0.75,"top":0.55})
		
		
		self.login_btn=Button(text="Přihlásit", size_hint=(0.2, 0.05),
							pos_hint={"x":0.28, "top":0.45})
		
		self.register_btn=Button(text="Zaregistrovat!", size_hint=(0.2, 0.05),
							pos_hint={"x":0.52, "top":0.45})

		# I use WifiSelectScreen no more 
		"""try:
			process_out = check_output(["iwgetid","-r"])        
			out = process_out.decode("utf-8").rstrip()
			
			self.wifi_ssid = " (" + out + ")"
		except:
			self.wifi_ssid = " (Nejste připojeni!)"""
			
		font_size = self.register_btn.font_size #get default font size to count go_back_btn size (from length of SSID)
		
		#self.go_back_btn=Button(text="Zpět na volbu Wi-Fi" + self.wifi_ssid, size_hint=(0.2 + ((font_size*len(self.wifi_ssid)*0.5)/Window.width), 0.05),pos_hint={"x":0.0, "top":1.0})

		self.register_btn.bind(on_press=self.registration_screen)
		self.login_btn.bind(on_release=self.login_user_into_account)
		#self.go_back_btn.bind(on_press=self.go_back)

		self.layout.add_widget(self.login_label)
		self.layout.add_widget(self.login_input)
		self.layout.add_widget(self.pwd_label)
		self.layout.add_widget(self.pwd_input)
		self.layout.add_widget(self.show_pwd_icon)
		self.layout.add_widget(self.login_btn)
		self.layout.add_widget(self.register_btn)
		#self.layout.add_widget(self.go_back_btn)

		
		#Nasleduje popup okno pro oznameni chyb pri prihlasovani
		self.popup_layout = FloatLayout()
		
		self.error_label= Label(text="Došlo k chybě!",size_hint=(1,0.75),pos_hint={"x":0.0, "top":1})
		
		self.popup_close_button = Button(text="OK", size_hint=(0.6, 0.25), pos_hint={"x":0.2, "top":0.25})

		self.popup_close_button.bind(on_press=self.close_popup)
		
		self.popup_layout.add_widget(self.error_label)
		self.popup_layout.add_widget(self.popup_close_button)

		self.popup_window = Popup(title="Došlo k chybě!", content=self.popup_layout, size_hint=(0.5,0.3))
		self.remove = ""

		#pouze pro testovani!!!
		self.login_input.text = "dinokino@seznam.cz"
		self.pwd_input.text = "abc123"
		
		#rovnez test:source=sys.path[0]+"/files/images/show.png"
		#self.ikona = RoomOverview("k.jpg", size_hint=(1, None), pos_hint={"x":0.0, "top":0.75}, height=150)
		#self.layout.add_widget(self.ikona)

		self.add_widget(self.layout)
		self.home_screen = None
		#zbytecne... self.main_app.sm.add_widget(self.home_screen)
		self.log_res = None
		
	def registration_screen(self, btn):
		self.main_app.sm.switch_to(self.main_app.registration, direction="left")
	
	def login_user_into_account(self, btn):		
		self.login_btn.text = "Přihlašuji"
		
		self.login_btn.disabled = True
		self.register_btn.disabled = True
		Clock.schedule_once(lambda dt: self.login_and_rebuild())
		
	def login_and_rebuild(self):
		login_result = self.main_app.fb.login_user(self.login_input.text, self.pwd_input.text)
		if(login_result != "SUCCESS"):                        
				if(login_result == "EMAIL_NOT_FOUND"):
						self.error_label.text = "Email nenalezen!"
						self.remove = "email"
				elif(login_result == "INVALID_PASSWORD"):
						self.error_label.text = "Špatné heslo!"
						self.remove = "pwd"
				elif(login_result == "INVALID_EMAIL"):
						self.error_label.text = "Neplatný email!"
				elif(login_result == "USER_DISABLED"):
						self.error_label.text = "účet byl deaktivován!"
				else:
					if(self.login_input.text == ""):
						self.error_label.text = "Musíte zadat login (email)!"
					elif(self.pwd_input.text == ""):
						self.error_label.text = "Musíte zadat heslo!"
					else:
						self.error_label.text = "Došlo k neznámé chybě!"
						print(login_result)
				self.popup_window.open()
		else:
				self.home_screen = HomeScreen(self.main_app, name="home")
				self.home_screen.reload_screen()
				self.main_app.sm.switch_to(self.home_screen, direction="left")
				
		
		self.login_btn.disabled = False
		self.register_btn.disabled = False
			
	def close_popup(self, btn):
		
			#next part only if we want to remove email or password when it is incorrect
			"""if(self.remove == "email"):
					self.login_input.text = ""
			if(self.remove == "pwd"):
					self.pwd_input.text = \"\""""
			self.popup_window.dismiss()
			
	def go_back(self, btn):		
		# I use WifiSelectScreen no more 
		#self.main_app.sm.switch_to(self.main_app.wifi_select, direction="right")
		pass
