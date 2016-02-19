# Third-party imports...
from lettuce import step, world


@step(r'I send a request for a friendship with "(.+)"')
def send_friendship_request(step, username):
    world.response = world.client.post('/api/v1/friendships/friendship/', {
        'username': username,
        'action': 'request'
    })


@step(r'I accept a friendship request from "(.+)"')
def accept_friendship_request(step, username):
    world.response = world.client.post('/api/v1/friendships/friendship/', {
        'username': username,
        'action': 'accept'
    })


@step(r'I reject a friendship request from "(.+)"')
def reject_friendship_request(step, username):
    world.response = world.client.post('/api/v1/friendships/friendship/', {
        'username': username,
        'action': 'reject'
    })


@step(r'I get my current friends')
def get_current_friends(step):
    world.response = world.client.get('/api/v1/friendships/friend/?status=A')


@step(r'I get my pending friends')
def get_pending_friends(step):
    world.response = world.client.get('/api/v1/friendships/friend/?status=P')


@step(r'I get users that are not friends')
def get_users_not_friends(step):
    world.response = world.client.get('/api/v1/friendships/friend/')
