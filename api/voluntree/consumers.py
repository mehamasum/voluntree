import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Interest
from .serializers import InterestGeterializer

class VolunteerInterestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print('here in connect')
        self.room_name = self.scope['url_route']['kwargs']['post_id']
        self.room_group_name = 'interested_%s' % self.room_name
        print('room_name', self.room_name)
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # return the first response 
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'generate_response',
                'data': {
                    'status': 200,
                }
            }
        )

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, query_data):
        query_data_json = json.loads(query_data)
        from_created_at = query_data_json.get('from_created_at', None)
        limit = query_data_json.get('limit', 20)
        interested = query_data_json.get('interested', True)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'generate_response',
                'from_created_at': from_created_at,
                'limit': limit,
                'interested': interested
            }
        )

    # Receive message from room group
    async def generate_response(self, event):
       

        data = event['data']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'data': data
        }))