from qutrunk.tools import produce_algorithm
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

produce_algorithm.run_algorithm(BASE_DIR +"/myFile.json")

