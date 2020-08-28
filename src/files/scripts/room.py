
import kivy 
from kivy.app import App 
from kivy.uix.switch import Switch
import socket
import time

from kivy.uix.label import Label
from kivy.uix.gridlayout import GridLayout
from kivy.uix.image import Image
from kivy.uix.button import Button
from kivy.uix.dropdown import DropDown
from kivy.uix.widget import Widget
from kivy.uix.spinner import Spinner
from kivy.uix.textinput import TextInput
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.widget import Widget
from kivy.core.window import Window
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.slider import Slider
from kivy.uix.scrollview import ScrollView
from kivy.graphics.instructions import InstructionGroup


import threading

from kivy.core.text import Label as CoreLabel

from kivy.graphics import Rectangle,RoundedRectangle, Color 

import sys

import json
import random
from functools import partial

class RoomOverview(FloatLayout):
	def __init__(self, homescreen, room, **kwargs):
		super(RoomOverview, self).__init__(**kwargs)
		self.img = Image(source=sys.path[0]+"/files/images/"+room['img']['src'])
		self.img_offset = room['img']['offset']
		self.lamp_light_img = Image(source=sys.path[0]+"/files/images/lamp2.png")
		self.lamps = []
		self.homescreen = homescreen
		self.room_name = room['name']
		self.room_db_name = room['db_name']
		devices = room["devices"]
		self.svetla={}
		for device in devices:
			zarizeni={}
			for pin in devices[device]["OUT"]:
				dev_pin = devices[device]["OUT"][pin]
				if("light" in dev_pin['io_type']):
					while((dev_pin['index']) > len(self.lamps)):
						self.lamps.append(None)
						
					light_addr = [room["db_name"], device, pin, devices[device]["IP"]]
					l=Light(light_addr, homescreen, dev_pin['index'],dev_pin['type'],
					dev_pin['value'],dev_pin['name'],width=64, height=64, 
					pos_hint={"top":1.0})   #0-len(self.room_db_name)*5
					
					self.lamps[dev_pin['index']-1] = l
					zarizeni[pin] = l
				else:
					pass
					
			self.svetla[device]=zarizeni
			
		self.temp = Temp(25+5*len(self.homescreen.rooms_overviews), pos_hint={"x":0.12}, pos=(0, self.y), size=(96,96), size_hint=(None,None))
		font=50
		self.room_name_label=Label(text=self.room_name, halign="left", valign="top", pos_hint={"x":0.03, "top":1.0}, font_size=font, pos=self.pos, size=self.size)
		self.room_name_label.bind(size=self.room_name_label.setter('text_size'))
					
		self.room_detail_screen = RoomDetailScreen(self, self.room_name, self.img_offset, name=self.room_db_name)
     
		self.bind(pos = self.update_rect, size = self.update_rect) 
		self.update_rect()
		
		self.initialized = False
		self.start_stream()
  
	def __del__(self): 
		print('Destructor Room')
		#self.close_stream()
		
	def update_rect(self, *args):
		#self.canvas.clear() 
		subtexture = self.img.texture.get_region(0, self.img_offset, self.img.texture.size[0], self.height)

		with self.canvas.before:
			 #self.canvas.clear() 
			 pass
		with self.canvas: 
			Color(1, 1, 1, 1)   
			Rectangle(texture=subtexture, pos=self.pos, size=self.size)
			Color(0, 0, 0, 0.4)          
			Rectangle(pos=self.pos, size=self.size)
	
		i=0
		for lamp in self.lamps:
			i = i+1
			if(len(self.lamps) > 5):
				x=self.pos[0]+600-74*len(self.lamps)+(lamp.idx-1)*74 + (len(self.lamps)-5)*74
			else:
				x=self.pos[0]+600-74*len(self.lamps)+(lamp.idx-1)*74
			
			lamp.pos = (x, self.pos[1])
			if(lamp in self.children):
				self.remove_widget(lamp)
			self.add_widget(lamp)
			if(i>4):
				break
			
		self.temp.pos=(0, self.pos[1])
		if(self.temp in self.children):
			self.remove_widget(self.temp)
		self.add_widget(self.temp)
            
		if(self.room_name_label in self.children):
			self.remove_widget(self.room_name_label)
		self.add_widget(self.room_name_label)
		
	def on_touch_down(self, touch):
		if self.collide_point(*touch.pos):
			for lamp in self.lamps:
				if(lamp.on_touch_down(touch)):
					return
			self.homescreen.main_app.sm.switch_to(self.room_detail_screen, direction="left")
		else:
			pass
		
	def room_update(self, msg):
		if(self.initialized == False):
			self.initialized = True
			return
			
		if(len(msg["path"].split('/')) == 5): #patch
			svetlo=self.svetla[msg["path"].split('/')[2]][msg["path"].split('/')[4]]
			svetlo.val = msg["data"]["value"]
		else: #put
			svetlo=self.svetla[msg["path"].split('/')[2]][msg["path"].split('/')[4]]
			if(msg["path"].split('/')[5] == "value"):
				svetlo.val = msg["data"]
			else:
				svetlo.name = msg["data"]
				
		self.room_detail_screen.reload_device_in_detail(svetlo)
		svetlo.update_rect()
		
	def start_stream(self):
		self.stream = self.homescreen.main_app.fb.get_user_rooms_stream(self.room_update, self.room_db_name)
			
	def close_stream(self):
		self.stream.close()
		
class RoomDetailScreen(Screen): 
	def __init__(self, room_overview, title, img_offset, **kwargs):
		super(RoomDetailScreen, self).__init__(**kwargs)
		self.room_overview = room_overview
		self.title = title
		self.lamps = self.room_overview.lamps
		self.main_layout = FloatLayout(size_hint=(1.0, 1.0))
		
		self.img=Image(source=sys.path[0]+"/files/images/k.jpg", pos_hint={"top":0.8,"x":0.0})
		
		self.lamp_fill = Image(source=sys.path[0]+"/files/images/lamp2.png")		
		
		self.header_layout=FloatLayout( pos_hint={"top":1.0}, height=150, size_hint=(1, None))
		subtexture = self.img.texture.get_region(0, 200, self.img.texture.size[0], 150)
		self.img_rect=Rectangle(texture=subtexture, pos_hint={"top":0.8,"x":0.0}, size_hint=(1.0, 1.0))
		
		self.go_back_button = Button(text="<--",pos_hint={"top":1.0,"x":0.0}, size_hint=(0.1,0.06))
		self.main_layout.add_widget(self.go_back_button)
		self.go_back_button.bind(on_press=self.go_back_to_overview) 
		
		font=50
		self.header_title=Label(text=self.title, font_size=font, color=[1.0, 1.0, 1.0, 1.0], pos_hint={"top":0.8,"x":0.0}, width=font*len(self.title)*0.75, size_hint=(None,1))
		#self.main_layout.add_widget(self.header_title)
		
		self.int_dev_count = 0
		for device in self.lamps:
			if(device.typ == "int"):
				self.int_dev_count += 1
				
		h = len(self.lamps)*50 + self.int_dev_count * 100 + (len(self.lamps)+1) * 10
		self.devices_layout = BoxLayout(orientation='vertical', spacing=10, padding=10, size_hint=(1, None), height=h)
		
		
		self.device_scroll_panel = ScrollView(size_hint=(1.0, None), height=Window.height-150)
		self.device_scroll_panel.add_widget(self.devices_layout)
		self.sliders = []
		self.switches = []
		
		self.devices = []		
		i = 0
		for device in self.lamps:
			dev = DeviceInDetail(i, device, self.room_overview, size_hint=(1.0, None), height=(150,50)[device.typ=="bool"])
			self.devices.append(dev)
			self.devices_layout.add_widget(dev)
			
			i += 1
		
		self.main_layout.add_widget(self.device_scroll_panel)
		
		self.add_widget(self.main_layout)
		
		self.ig = InstructionGroup()
		
		self.bind(pos = self.update, size = self.update) 
		
		
		self.update()
		
	def update(self, *args):
		self.img_rect.pos = (0, Window.height-155)
		self.img_rect.size = (Window.width, 150)
		
		c=0.38
		self.device_scroll_panel.canvas.before.add(Color(c, c, c,1))
		self.device_scroll_panel.canvas.before.add(Rectangle(pos=self.device_scroll_panel.pos, size=self.device_scroll_panel.size))
		
		self.ig.clear()
		
		c=0.5  
		self.ig.add(Color(c, c, c, 1)) 	
		self.ig.add(Rectangle(size=self.size, pos=self.pos))
		self.ig.add(Color(1, 1, 1, 1)) 	
		self.ig.add(self.img_rect)  
		self.ig.add(Color(0, 0, 0, 0.4)) 	
		self.ig.add(Rectangle(size=self.img_rect.size, pos=self.img_rect.pos))  
		
		self.ig.add(Color(1, 1, 1, 1)) 	
		font=50
		l=CoreLabel(text=self.title, padding=10, font_size=font, color=(1, 1, 1, 1))
		l.refresh()
		texture = l.texture
		texture_size = list(texture.size)
		self.ig.add(Rectangle(texture=texture, size=texture_size, pos=(self.img_rect.pos[0],self.img_rect.pos[1])))
			
		self.canvas.before.add(self.ig)
		
		if(self.go_back_button in self.main_layout.children):
			self.main_layout.remove_widget(self.go_back_button)
		self.main_layout.add_widget(self.go_back_button)
		
	def send_value_thread(self, value, addr):
		self.room_overview.homescreen.main_app.fb.set_value_of_OUT(value, addr)
		
	def go_back_to_overview(self, button):
		home = self.room_overview.homescreen
		sm = home.main_app.sm
		sm.switch_to(home, direction="right")
		
	def reload_device_in_detail(self, device):	
		for dev in self.devices:
			if(dev.device.addr == device.addr):
				dev.reload_device(device)
			

size=1
class DeviceInDetail(FloatLayout):
	def __init__(self, i, device, room_overview, **kwargs):
		super(DeviceInDetail, self).__init__(**kwargs)
		self.device = device
		self.room_overview = room_overview
		self.i = i
		self.ig = InstructionGroup()
		
		self.slider = None
		if(self.device.typ == "bool"):
			a = (False,True)[self.device.val == "on"]
			self.switch = Switch(active=a, size_hint=(0.2, 1.0), pos_hint={"right":0.95, "top":1})	
		else:
			a = (False, True)[float(self.device.val) > 0.0]
			self.slider = Slider(min=0, max=1024, value=device.val, size_hint=(0.8, 0.66), pos_hint={"right":0.9, "top":0.66})					
			self.slider.bind(value=self.slider_value_change)
			
			self.add_widget(self.slider)	
			self.switch = Switch(active=a, size_hint=(0.2, 0.33), pos_hint={"right":0.95, "top":1})
		
		self.can_raise_event = True #for raising switch/slider event only if manually switch/slide and not if is called function self.reload_device()
		
		self.add_widget(self.switch)	
		self.device_name_label=self.get_label()
		self.switch.bind(active=self.switch_event)
		
		self.update()	
		self.bind(pos=self.update,size=self.update)
		
	def update(self, *args):
		with self.canvas.before:
			self.canvas.clear()
		
		with self.canvas:
			ig = InstructionGroup()
			c = 0.3
			ig.add(Color(c, c, c, 1))
			r = 25.0
			if(self.device.typ == "bool"):
				ig.add(RoundedRectangle(pos=self.pos,size=self.size, radius=[(r,r), (r,r), (r,r), (r,r)]))
			else:
				ig.add(RoundedRectangle(pos=(self.pos[0], self.pos[1]+self.size[1]*(2/3)),size=(self.size[0],self.size[1]*(1/3)), radius=[(r,r), (r,r), (0,0), (0,0)]))
				c = 0.3
				ig.add(Color(c, c, c+0.03, 1))
				ig.add(RoundedRectangle(pos=self.pos,size=(self.size[0],self.size[1]*(2/3)), radius=[(0,0), (0,0), (r,r), (r,r)]))
		
			ig.add(Color(1.0, 1.0, 1.0, 1))
			font=30
			l=CoreLabel(text=self.device_name_label, font_size=font, pos=self.pos)
			l.refresh()
			texture = l.texture
			texture_size = list(texture.size)
			if(self.device.typ == "bool"):
				ig.add(Rectangle(texture=texture, size=texture_size, pos=(self.pos[0]+30, self.pos[1]+10)))
			else:
				ig.add(Rectangle(texture=texture, size=texture_size, pos=(self.pos[0]+30, self.pos[1]+self.size[1]*(2/3)+10)))
		
		if(self.switch in self.children):
			self.remove_widget(self.switch)
		self.add_widget(self.switch)
		
		if(self.device.typ != "bool"):
			if(self.slider in self.children):
				self.remove_widget(self.slider)
			self.add_widget(self.slider)			
	"""	
	def send_value_thread(self, value, addr):
		self.room_overview.homescreen.main_app.fb.set_value_of_OUT(value, addr)"""
		
	def switch_event(self, switch, active):
		if(self.can_raise_event == False):
			return
			
		v = self.device.val		
		if(self.device.typ == "bool"):
			v = ("off", "on")[v == "off"]
			popisek = ("vypnuto", "zapnuto")[v == "on"]
			text = self.device.name + " ("+popisek+")"
		else:
			if(v == "0.0"):
				v = "1024.0"
				text = self.device.name + " (100%)"
				self.slider.value = 1024
			else:
				v = "0.0"
				text = self.device.name + " (vypnuto)"
				self.slider.value = 0
		
		self.device.val = v
		
		self.device_name_label = text
		self.update()
		
					
		send_thread = threading.Thread(target=self.device.send_value_thread)
		send_thread.start()
		self.device.send_to_device()
		
	def slider_value_change(self, slider, value):
		if(self.can_raise_event == False):
			return
		text = self.device.name + " ("+str(int(100*(value/1024)))+"%)"
		
		if(value == 0):
			self.switch.active=False
		if(value > 0 and self.switch.active == False):
			self.switch.active=True
			
		self.device.val = value
		
		self.device_name_label = text
		self.update()		
		
		send_thread = threading.Thread(target=self.device.send_value_thread)
		send_thread.start()
		self.device.send_to_device()
		
	def get_label(self):	
		if(self.device.typ == "bool"):
			v = ("vypnuto", "zapnuto")[self.device.val == "on"]
			return self.device.name + " (" + v + ")"
		else:
			v = ("vypnuto)", str(int(100*(float(self.device.val)/1024)))+"%)")[float(self.device.val) > 0.0]
			return self.device.name + " (" + v
	
	def reload_device(self, device):
		self.can_raise_event = False		
		if(self.device.typ == "int"):
			self.slider.value = device.val
			if(int(float(self.device.val)) == 0 and int(float(device.val)) > 0):
				self.switch.active = True
			elif(int(float(self.device.val)) > 0 and int(float(device.val)) == 0):
				self.switch.active = False
		elif(self.device.typ == "bool"):
			if(self.switch.active == True):
				self.switch.active = False
			else:
				self.switch.active = True
		self.device.name = device.name
		self.device.val = device.val
		self.device_name_label = self.get_label()
		self.update()
		self.can_raise_event = True
		
size=1
class Light(Widget):
	def __init__(self, addr, homescreen, idx, typ, val, name, **kwargs):
		super(Light, self).__init__(**kwargs)
		self.addr = addr
		self.addr_room = addr[0]
		self.addr_device = addr[1]
		self.addr_pin = addr[2]
		self.addr_IP = addr[3]
		self.homescreen = homescreen
		self.idx = idx
		self.typ = typ
		self.val = val
		self.name = name
		self.lamp_outline = Image(source=sys.path[0]+"/files/images/lamp1.png")
		self.lamp_fill = Image(source=sys.path[0]+"/files/images/lamp2.png")
		self.bind(pos = self.update_rect, 
                  size = self.update_rect) 		
		self.rect_fill = Rectangle(texture=self.lamp_fill.texture.get_region(0,0,64,self.get_fill_size()), pos=self.pos, size_hint=(None, None), size=(64/size, self.get_fill_size()/size))
		self.rect_outline = Rectangle(texture=self.lamp_outline.texture, pos=self.pos, size_hint=(None, None), size=(64/size, 64/size))
		
		self.currently_sending = False
		self.s = Slider(min=0, max=102, width=64, height=102, value=self.get_slider_val(),
		pos=(self.pos[0],self.pos[1]+64), orientation='vertical')
		
		self.update_rect()
  
	def update_rect(self, *args): 
		tex=self.lamp_fill.texture.get_region(0,0,64,self.get_fill_size())
		self.rect_fill.texture=tex
		self.rect_fill.size=(64/size, self.get_fill_size()/size)
		self.rect_fill.pos = self.pos
		self.rect_outline.pos = self.pos	
		self.s.pos = (self.pos[0],self.pos[1]+64)	
		
		with self.canvas.before: 
			self.canvas.clear()
		with self.canvas: 
			ig = InstructionGroup() 
			ig.add(Color(1, 1, 1, 1)) 	
			ig.add(self.rect_fill)  
			ig.add(self.rect_outline) 
			
			l=CoreLabel(text=self.name, color=(1, 1, 1, 1), pos=self.pos)
			l.refresh()
			texture = l.texture
			texture_size = list(texture.size)
			ig.add(Rectangle(texture=texture, size=texture_size, pos=(self.pos[0]+(64-len(self.name)*5)/2, self.pos[1]+64+3+(self.idx%2)*15)))#pos=(self.pos[0]+(64-len(self.name)*5)/2+74*self.idx,self.pos[1]+64+3+(self.idx%2)*15)))
		
		if(self.s in self.children):
			self.remove_widget(self.s)
			self.add_widget(self.s)
		
		
	def on_touch_down(self, touch):
		if (touch.x > self.x and touch.x < self.x+64):
			if(touch.y > self.y and touch.y < self.y+64): #touch lamp symbol	
				if(self.typ == "int"):#show/hide slider
					if(self.s in self.children):
						self.remove_widget(self.s)
					else:
						self.add_widget(self.s)	
				else:#change on/off
					if(self.val == "on"):
						self.val = "off"
					else:
						self.val = "on"	
					self.update_rect()					
					send_thread = threading.Thread(target=self.send_value_thread)
					send_thread.start()
					self.send_to_device()
					#send_thread.join()
				return True
					
			elif(touch.y > self.s.y and touch.y < self.s.y+self.s.height): #touch slider
				if(self.s in self.children):
					self.s.value = (touch.y-self.s.y)
					self.val = (self.s.value/100)*1024
					self.update_rect()			
					send_thread = threading.Thread(target=self.send_value_thread)
					send_thread.start()
					self.send_to_device()
					return True
            
	def on_touch_move(self, touch):
		if (touch.x > self.x and touch.x < self.x+64):
			if(touch.y > self.s.y and touch.y < self.s.y+self.s.height): #touch slider
				if(self.s in self.children):
					self.s.value = (touch.y-self.s.y)
					self.val = (self.s.value/100)*1024
					self.update_rect()
					send_thread = threading.Thread(target=self.send_value_thread)
					send_thread.start()
					self.send_to_device()
					
	"""def on_touch_up(self, touch):
		if (touch.x > self.x and touch.x < self.x+64):
			if(touch.y > self.s.y and touch.y < self.s.y+self.s.height): #touch_up slider
				send_thread = threading.Thread(target=self.send_value_thread)
				send_thread.start()
				#send_thread.join()"""
			
		
	def send_value_thread(self):
		self.homescreen.main_app.fb.set_value_of_OUT(self.val, self.addr)
		
	def get_value(self):
		return self.val
		
	def get_fill_size(self):
		if(self.typ == "bool"):
			if(self.val == "on"):
				return 64
			else:
				return 0
		else:
			return (float(self.val)/1024) * 64
		
	def get_slider_val(self):
		if(self.typ == "bool"):
			if(self.val == "on"):
				return 102
			else:
				return 0
		else:
			return (float(self.val)/1024) * 102
			
	def send_to_device(self):
		self.currently_sending = True
		#192.168.1.6 5684
		HOST = '192.168.1.6'  # The server's hostname or IP address
		PORT = 60000        # The port used by the server
		s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		s.connect((HOST, PORT))
		time.sleep(0.1)
		#s.sendall(bytearray("4", "utf-8"))
		#data = self.addr_pin[1:len(self.addr_pin)]
		value_to_send = None
		if(self.typ == "bool"):
			if(self.val == "on"):
				value_to_send = 1
			else:
				value_to_send = 0
		else:
				value_to_send = int(float(self.val))
			
		#data=bytes(chr((int(int("d4"[1:len("d4")])) | value_to_send)), "utf-8")
		data=bytearray(2)
		data[0] = value_to_send >> 8
		data[1] = value_to_send & 255
		
		print(s.send(data))
		s.close()
		#data = s.recv(1024)
		#print('Received', repr(data))
			
class Temp(Widget):
	def __init__(self, val, **kwargs):
		super(Temp, self).__init__(**kwargs)
		self.val=val
		self.drop_img = Image(source=sys.path[0]+"/files/images/drop3.png",pos=self.pos,size=self.size)
			
		self.img_rect = Rectangle(texture=self.drop_img.texture, pos=self.pos, size_hint=(1,1))
		self.temp_label = Label(text=str(self.val)+"°C", color=[1, 1, 1, 1], font_size=35, pos=(self.pos[0],self.pos[1]-20))
		#self.add_widget(self.temp_label)
		self.bind(pos = self.update_rect, size = self.update_rect)
		
		self.drop_img_rect = Rectangle(texture=self.drop_img.texture, pos=self.pos, size_hint=(None, None), size=(self.size[0], self.size[1]))
		
		self.update_rect()
		
	def update_rect(self, *args): 
		#self.img_rect = Rectangle(texture=self.drop_img.texture, pos=self.pos, size_hint=(1,1))
		self.canvas.clear()
		
		with self.canvas:	
			
			ig = InstructionGroup() 
			ig.add(Color(1, 1, 1, 1)) 	
			self.drop_img_rect.pos=self.pos
			ig.add(self.drop_img_rect)  
			
			"""
			Color(1, 1, 1, 1)   
			Rectangle(texture=self.drop_img.texture, pos=self.pos, size=self.size) """
		
			l=CoreLabel(text=str(self.val)+"°C", padding=10, font_size=35, color=(1, 1, 1, 1), pos=(self.pos[0],self.pos[1]-20))
			l.refresh()
			texture = l.texture
			texture_size = list(texture.size)
			ig.add(Rectangle(texture=texture, size=texture_size, pos=(self.pos[0],self.pos[1])))
