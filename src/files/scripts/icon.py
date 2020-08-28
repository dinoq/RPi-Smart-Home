
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

class ShowHideIcon(Image):
	def __init__(self, flag, pinput, **kwargs):
		super(ShowHideIcon, self).__init__(**kwargs)
		self.source=sys.path[0]+"/files/images/show.png"
		
		self.show_pwd_flag = flag
		self.pwd_input = pinput
		self.bind(on_touch=self.on_touch_down)
        
	def on_touch_down(self, touch):
		if self.collide_point(*touch.pos):
			if(self.show_pwd_flag==0):
				self.source=sys.path[0]+"/files/images/hide.jpg"
				self.show_pwd_flag=1
				self.pwd_input.password = False
			else:
				self.source=sys.path[0]+"/files/images/show.png"
				self.show_pwd_flag=0
				self.pwd_input.password = True


"""
puvodni:
class ShowIcon():
    def __init__(self, size_hint, pos_hint, flag, pinput):
        self.img = Image(source=sys.path[0]+"/files/images/show.png", size_hint=(size_hint), pos_hint={"x": pos_hint["x"], "top": pos_hint["top"]})
    
        self.show_pwd_flag = flag
        self.pwd_input = pinput
        self.img.bind(on_touch=self.on_touch_down)
        
    def on_touch_down(self, touch):
        print("TISK")
        print(self.pwd_input.text)
        self.pwd_input.text="HAHAHAAAAAAAAA"
        if self.collide_point(*touch.pos):
            if(self.show_pwd_flag==0):
                self.img.source=sys.path[0]+"/files/images/hide.jpg"
                self.show_pwd_flag=1
                self.pwd_input.password = False
            else:
                self.img.source=sys.path[0]+"/files/images/show.png"
                self.show_pwd_flag=0
                self.pwd_input.password = True


"""
