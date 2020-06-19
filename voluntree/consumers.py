import json
from channels.generic.websocket import AsyncWebsocketConsumer


class PostInterestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['post_id']
        self.room_group_name = 'interested_%s' % self.room_name
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def send_post_intereset_response(self, event):
        data = event['data']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({'data': data}))


class SlotInterestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['slot_id']
        self.room_group_name = 'slot_%s' % self.room_name
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def send_post_intereset_response(self, event):
        data = event['data']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({'data': data}))