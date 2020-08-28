
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

from .icon import ShowHideIcon

import sys

from subprocess import check_output
import threading

class RegistrationScreen(Screen): 
	def __init__(self, m_app, **kwargs):
		super(RegistrationScreen, self).__init__(**kwargs)
		self.main_app = m_app
		self.load()
                
	def load(self):

		self.layout = FloatLayout()
		
		self.login_label= Label(text="Uživatelské jméno",
						   size_hint=(0.5,0.05),
						   pos_hint={"x":0.0, "top":0.75})

		self.login_input=TextInput(multiline=False, password=True,
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
		
		self.register_btn=Button(text="Zaregistrovat!", size_hint=(0.2, 0.05),
							pos_hint={"x":0.52, "top":0.45})
		
		self.back_btn=Button(text="Zpět na přihlášení", size_hint=(0.3, 0.05),
							pos_hint={"x":0.0, "top":1.0})

		self.register_btn.bind(on_press=self.register)
		self.back_btn.bind(on_press=self.go_back_to_login)

		self.layout.add_widget(self.login_label)
		self.layout.add_widget(self.login_input)
		self.layout.add_widget(self.pwd_label)
		self.layout.add_widget(self.pwd_input)
		self.layout.add_widget(self.show_pwd_icon)
		self.layout.add_widget(self.register_btn)
		self.layout.add_widget(self.back_btn)

		self.add_widget(self.layout) 

                
	def register(self, btn):
		print("REGISTRUJI...")
                
	def go_back_to_login(self, instance):
		self.main_app.sm.switch_to(self.main_app.login, direction="right")
		

