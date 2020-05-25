import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Interest
from .serializers import InterestGeterializer

class VolunteerInterestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['post_id']
        self.room_group_name = 'interested_%s' % self.room_name

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
                'from_created_at': None,
                'limit': 20,
                'interested': True,
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
        from_created_at = event.get('from_created_at')
        limit = event.get('limit', 20)
        interested = event.get('interested')
        queryset = Interest.objects.filter(
            create_at__lt=from_created_at,interested=interested)[:limit]
        serializer = InterestGeterializer(queryset, many=True)
        response = InterestGeterializer()

        await self.send(response)