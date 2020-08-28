import kivy 
from kivy.app import App 

from kivy.uix.label import Label
from kivy.uix.gridlayout import GridLayout
from kivy.uix.button import Button
from kivy.uix.dropdown import DropDown
from kivy.uix.widget import Widget
from kivy.uix.spinner import Spinner
from kivy.uix.textinput import TextInput
from kivy.uix.floatlayout import FloatLayout
from kivy.core.window import Window
from kivy.uix.screenmanager import ScreenManager, Screen

from .icon import ShowHideIcon

import threading
import sys

#potřebné importy:
from subprocess import check_output

class WifiSelectScreen(Screen):
	def __init__(self, m_app, **kwargs):
		super(WifiSelectScreen, self).__init__(**kwargs)
		self.main_app = m_app
		self.load()
			
	def load(self):
		
		#create main layout of this screen
		self.layout = FloatLayout()
		
		#button for searching for WiFi (Scan of SSIDs)
		self.scan=Button(text="Skenovat sítě wifi", size_hint=(0.3, 0.05),
							pos_hint={"x":0.35, "top":0.80})

		#label for select of WiFi
		self.select_label= Label(text="Zvolte SSID:",
						   size_hint=(0.5,0.05),
						   pos_hint={"x":0.0, "top":0.75})

		#Selection of WiFi to connect
		self.select=Spinner(text="Vyberte", values=(""),
					   size_hint=(0.5,0.1), pos_hint={"x":0.25, "top":0.7})
		
		#label for password to WiFi
		self.pwd_label= Label(text="Zadejte heslo:",
						   size_hint=(0.5,0.05),
						   pos_hint={"x":0.0, "top":0.6})

		#Input element for password
		self.pwd_input=TextInput(multiline=False, password=True,
						   size_hint=(0.5,0.05),
						   pos_hint={"x":0.25, "top":0.55})

		#Flaf to determine if show password as readable text or "*"
		self.show_pwd_flag=0
		#Icon for toggle between show and hide password
		self.show_pwd_icon = ShowHideIcon(self.show_pwd_flag,self.pwd_input, size_hint=(0.07, 0.05), pos_hint={"x":0.75,"top":0.55})
		
		#Button element to connect to WiFi
		self.connect=Button(text="Připojit", size_hint=(0.2, 0.05),
							pos_hint={"x":0.28, "top":0.45})
		
		#bindings when press scan button, connect button and when selection of WiFi has changed (to fill password)
		self.scan.bind(on_press=self.scan_network)
		self.connect.bind(on_press=self.connect_to_network)
		self.select.bind(text=self.password_from_file)

		#Add all elements to main layout
		self.layout.add_widget(self.scan)		
		self.layout.add_widget(self.select_label)
		self.layout.add_widget(self.select)
		self.layout.add_widget(self.pwd_label)
		self.layout.add_widget(self.pwd_input)
		self.layout.add_widget(self.show_pwd_icon)
		self.layout.add_widget(self.connect)
		
		#add main layout to this screen
		self.add_widget(self.layout)     
		#self.scan_network(None)
		return


	def scan_network(self, instance):
		self.scan.disabled = True
		self.scan.text = "SKENUJI"
		thr=threading.Thread(target=self.scan_thread, args=())
		thr.start()
		#thr.join()
	 
	def scan_thread(self):
		try:
			process_out = check_output(["sudo", "iwlist", "wlan0", "scan"])        
			out = process_out.decode("utf-8")
			start = 0;
			end = 0;
			ssids = []
			nalezena_vsechna_SSID = False
			while not nalezena_vsechna_SSID:
				start=out.find("ESSID:", start)
				if(start == -1):
					break;
				end=out.find("\"", start+7)
				ssids.append(out[start+7:end])
				start = end
			self.select.values = ssids  
			self.select.text = ssids[0]
		except Exception as e:
			print("Nenalezeno!")
			print(e)
		finally:
			self.scan.text="Skenovat sítě wifi"
			self.scan.disabled = False
			
		
	def password_from_file(self, spinner, text):
		f = open("/etc/wpa_supplicant/wpa_supplicant.conf","r")
		file_str = f.read()

		if(text in file_str):
			hledany_text="ssid=\""+text
			zacatek_vyhledavani=file_str.find(hledany_text)
			start=file_str.find("psk=\"", zacatek_vyhledavani)+5
			end=file_str.find("\"", start)
			
			self.pwd_input.text = file_str[start:end]
			
		else:
			self.pwd_input.text = ""
			
	def connect_to_network(self, instance):
		self.main_app.sm.switch_to(self.main_app.login, direction="left")
			



