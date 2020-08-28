
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
from kivy.uix.scrollview import ScrollView
from kivy.graphics.instructions import InstructionGroup

from kivy.animation import Animation

from kivy.graphics import Rectangle, Color 

from .room import RoomOverview

import sys

from subprocess import check_output
import threading


class RoomManagerScreen(Screen): 
	def __init__(self, home_screen, **kwargs):
		super(RoomManagerScreen, self).__init__(**kwargs)
		self.home_screen = home_screen
		self.load()
			
	def load(self):
		self.layout = FloatLayout(size_hint=(1.0, 1.0))
		self.add_widget(self.layout)
		
		self.rooms_layout = BoxLayout(orientation='vertical', size_hint=(1, None), height= 5*250, pos_hint={"top":1.0, "x":0.0})		
		self.layout.add_widget(Button(text="+", font_size=40, size_hint=(0.2, 0.1), pos_hint={"top":0.95, "x":0.4}))
		self.rooms_scroll_panel = ScrollView(size_hint=(1, 0.9), pos_hint={"top":0.8, "x":0.0})
		self.rooms_scroll_panel.add_widget(self.rooms_layout)
		self.layout.add_widget(self.rooms_scroll_panel)
		
		
		self.go_back_button = Button(text="<--",pos_hint={"top":1,"x":0.0}, size_hint=(0.2,0.075))
		self.layout.add_widget(self.go_back_button)		
		self.go_back_button.bind(on_press=self.go_back_to_overview) 
		
		for i in range(0,5):
			container = BoxLayout(orientation="horizontal",size_hint=(1.0, None), height=250, pos_hint={"top":1.0, "x":0.0})
			self.rooms_layout.add_widget(container)
			
			left = BoxLayout(orientation='vertical', size_hint=(0.15, 1))
			right = BoxLayout(orientation='vertical', size_hint=(0.85, 1))
			container.add_widget(left)
			container.add_widget(right)
			
			up = Button(text="nahoru", font_size=20, size_hint=(1.0, 0.5))
			down = Button(text="dolů",font_size=20, size_hint=(1.0, 0.5))			
			left.add_widget(up)
			left.add_widget(down)
			
			
			room = FloatLayout()
			font=30
			room_name = Label(text="Kuchyň", halign="left", valign="top", pos_hint={"x":0.03, "top":1.0}, font_size=font)
			room_name.bind(size=room_name.setter('text_size'))
			room.add_widget(room_name)
			right.add_widget(room)
			
		self.save_btn = Button(text="Uložit", size_hint=(0.1, 0.2), pos_hint={"left":0.45, "top":0.1})
		self.layout.add_widget(self.save_btn)
		self.save_btn.bind(on_press=self.save_rooms)
			
	def go_back_to_overview(self, button):
		#self.home_screen.reload_screen() ??? To spíš při ukládání ne???
		sm = self.home_screen.main_app.sm
		sm.switch_to(self.home_screen, direction="right")
			
	def save_rooms(self, button):
		pass

