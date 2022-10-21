# coding=utf-8
import time
import psutil
import wmi
myWmi= wmi.WMI()
import sys
import io
import argparse
import os

l = psutil.cpu_count()  # 取得cpu数量
def get_cpu_info(t):
	'''
	获取实时cpu资源使用情况
	return:
		cpu使用情况
	'''

	cpu_m = []  # 改变数据结构 ：[['16时25分53秒', 'all', '12.4'], ['16时25分53秒', '0', '16.9']]
	a_cpu = 0  # 记录这个cpu的使用情况，以便计算总cpu
	for i in range(l):
		a_cpu += percpu[i]
		cpu_m.append([t,str(i),str(percpu[i])])
	return [[t, 'all', str(round((a_cpu/l), 1))]] + cpu_m  # 所有cpu平均资源 + 每个cpu具体资源


def get_memory(t):
	'''
	获取实时ram资源使用情况
	return:
		ram使用情况
	'''
	mem = psutil.virtual_memory()
	return {'total': mem.total, 'used': mem.used, 'free': mem.free, 'time': t}


def get_dist():
	'''
	获取实时磁盘资源使用情况，win无法获取读写速度
	return:
		磁盘使用情况
	'''
	d = {}
	for i in psutil.disk_partitions():
		d[i.device] = {"rkB/s": "", "wkB/s": "", "%util": ""}
	return  d
	

if __name__ =='__main__':
	'''
	如果还未生成uuid文件，判断为job正在run，输出实时数据
	调用命令：
		python3 real_time.py --tag 1652600819 --job myjobname
	'''
	parser = argparse.ArgumentParser()
	parser.add_argument("--tag")
	parser.add_argument("--job")
	args = parser.parse_args()

	if args.tag and args.job:
		work_dir = os.path.dirname(os.path.realpath(sys.argv[0]))
		dir = os.path.join(work_dir, 'run_data', args.tag+'_!tag_'+args.job)
		while True:
			if os.path.exists(os.path.join(dir, '1.txt')):
				print('done',end='')
				sys.stdout.flush()
				break
			percpu = psutil.cpu_percent(interval=1, percpu=True)  # 取得所有cpu资源使用情况
			t = time.strftime('%H时%M分%S秒', time.localtime(time.time()))  # 取得当前时间
			cp = {
				'cpu': get_cpu_info(t),
				'disk': get_dist(),
				'ram': get_memory(t)
			}
			# sys.stdout = io.TextIOWrapper(sys.stdout.detach(),encoding='utf-8')
			print((str(cp).replace("'", '"')),end="")
			sys.stdout.flush()
			# time.sleep(1)
	else:
		print('miss tag or job args', end='')
		sys.stdout.flush()
		
