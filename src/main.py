
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

import sys

from subprocess import check_output

from files.scripts.login import LoginScreen
from files.scripts.registration import RegistrationScreen
from files.scripts.firebase import FireDatabase

#importy pouze pro testování:
import time

class MainApp(App): 
	def build(self):
			
		self.sm = ScreenManager()     

		self.fb = FireDatabase()
		
		# I use WifiSelectScreen no more 
		#self.wifi_select = WifiSelectScreen(self, name="wifi_select")
		#self.sm.add_widget(self.wifi_select)
        
		self.login=LoginScreen(self, name="login")

		self.registration = RegistrationScreen(self, name="registration")

		self.sm.switch_to(self.login)
		#self.login.login_user_into_account(None)
		#self.sm.current="wifi_select"
		return self.sm
		
	def on_stop(self):
		rooms_count = len(self.login.home_screen.rooms_overviews)
		print("rooms_count:")
		print(rooms_count)
		for i in range(0,rooms_count):
			#self.login.home_screen.rooms_overviews[i].close_stream() #close all streams
			pass
			
		#del self.login.home_screen.rooms_overviews[0]
		print("deleted!")
		
	"""def logout_user(self):
		self.sm.switch_to(LoginScreen(self, name="login"), direction="right")"""
            
app = MainApp()
app.run()
