import logging


class LogShim(object):
    def __init__(self, logger):
        self.logger = logger

    def log(self, level, *msg):
        if self.logger.isEnabledFor(level):
            concatenated = " ".join(str(a) for a in msg)
            self.logger.log(level, concatenated)

    def debug(self, *msg):
        self.log(logging.DEBUG, *msg)

    def info(self, *msg):
        self.log(logging.INFO, *msg)

    def warning(self, *msg):
        self.log(logging.WARNING, *msg)

    def error(self, *msg):
        self.log(logging.ERROR, *msg)

    def critical(self, *msg):
        self.log(logging.CRITICAL, *msg)
