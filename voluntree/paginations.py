from rest_framework.pagination import CursorPagination
class CreationTimeBasedPagination(CursorPagination):
    # page size is bigger than usual, for list of messages in a thread
    ordering = '-created_at'