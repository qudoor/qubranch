#coding=utf8
# gpu所需字段：型号、算力、主频、SM数、共享内存、L2 Cache
import psutil
import socket,sys
import multiprocessing, subprocess

def is_None(can):
	'''
	判断是否为None值
	return:
		参数值或''
	'''
	return can if can else ''
	


def get_cpu():
    '''
    获取CPU参数
	return:
    	cpu所需字段:CPU型号、主频、核心数、线程数、L1 Cache、L2 Cache、指令集
    '''
    cpu_info = {}
    output = subprocess.getoutput('sysctl machdep.cpu')
    for i in output.replace('：',':').split('\n'):
        cpu_info[i.split(':')[0]] = i.split(':')[1].lstrip()
    return 'CPU', cpu_info


def get_ip():
	'''
	获取ip
	return:
		ip地址
	'''
	output = subprocess.getoutput('ifconfig | grep "inet " | grep -v 127.0.0.1')

	return 'ip', {'ip':output.split(' netmask')[0].replace('inet ','')}


def memory_info():
	'''
	获取内存相关参数
	return:
		内存类型、通道数、大小、频率
	'''
	ram = psutil.virtual_memory()
	output = subprocess.getoutput("system_profiler SPMemoryDataType | grep -E 'Type|Speed'")
	a = (output.replace(' ','').split('\n'))[:2]
	return 'ram', {
		a[0].split(':')[0]: a[0].split(':')[1],
		a[1].split(':')[0]: a[1].split(':')[1],
		'total': ram.total, 'free':  ram.free, 'used': ram.used}


def sys_version():
	'''
	获取系统信息
	return:
		名称、位
	'''
	
	return 'OS', {"名称":subprocess.getoutput('sw_vers').replace('\n',"  |  ")}


def get_net_io():
	'''
	获取网络io
	return:
	    网络io
	'''
	result_info = {}
	net = psutil.net_io_counters()
	bytes_sent = '{0:.2f} Mb'.format(net.bytes_recv / 1024 / 1024)
	bytes_rcvd = '{0:.2f} Mb'.format(net.bytes_sent / 1024 / 1024)
	result_info['上行'] = is_None(bytes_sent)
	result_info['下行'] = is_None(bytes_rcvd)
	return '网络I/O', result_info


def get_dist_io():
	'''
	获取磁盘io
	return:
	    磁盘io
	'''
	result_info = {}
	io = psutil.disk_io_counters()
	bytes_read = '{0:.2f} Gb'.format(io.read_bytes / 1024 / 1024 / 1024)
	bytes_write = '{0:.2f} Gb'.format(io.write_bytes / 1024 / 1024 / 1024)
	result_info['读'] = is_None(bytes_read )
	result_info['写'] = is_None(bytes_write)
	return '磁盘I/O', result_info


def run__process():
	'''
	多进程获取
	'''
	pool = multiprocessing.Pool()
	multi_result = [pool.apply_async(func=get_cpu,),
               pool.apply_async(func=get_ip,), 
			   pool.apply_async(func=memory_info,), 
			   pool.apply_async(func=sys_version,), 
			#    pool.apply_async(func=get_net_io,), 
			#    pool.apply_async(func=get_dist_io,)
			   ]
	pool.close()
	pool.join()
	cp = {}
	for _r in multi_result:
		cp[_r.get()[0]] = _r.get()[1]
	print(("["+str(cp).replace("'", '"')+"]"), end='')
	sys.stdout.flush()


if __name__ =='__main__':
	multiprocessing.freeze_support()
	'''
	需求如下：
		ip所需字段：ip
		os所需字段:名称、位
		cpu所需字段:CPU型号、主频、核心数、线程数、
		L1 Cache、L2 Cache、指令集
		gpu所需字段：型号、算力、主频、SM数、共享内存、L2 Cache
		内存所需字段：内存类型、通道数、大小、频率
		网络I/O所需字段：网络I/O
		磁盘I/O所需字段：磁盘I/O
	实现获取需求字段
	'''
	run__process()
