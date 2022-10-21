#coding=utf8
# gpu所需字段：型号、算力、主频、SM数、共享内存、L2 Cache
import wmi, psutil
import socket
import sys
import io
import multiprocessing

# sys.stdout = io.TextIOWrapper(sys.stdout.detach(),encoding='utf-8')
cpu_core = ''
result_info = {}
cpu_speed_list = []
c = wmi.WMI()

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
	result_info = {}
	for _cpu in c.Win32_Processor():
		is_None(_cpu.Name.strip())
		result_info['CPU型号'] = is_None(_cpu.Name.strip())
		result_info['主频'] = '%sMHz' % is_None(_cpu.MaxClockSpeed)
		result_info['核心数'] = is_None(_cpu.NumberOfCores)
		result_info['线程数'] = is_None(_cpu.ThreadCount)
		result_info['L1 Cache'] = is_None(int(
            _cpu.NumberOfCores) * 32 if _cpu.NumberOfCores else '0')
		result_info['L2 Cache'] = is_None(_cpu.L2CacheSize)
		result_info['指令集'] = ''
		# 规格、
		# 核心数、
		# 线程数、
		# 主频、
		# 指令集、
		# 名字、
		# 代号、
		# TDP、
		# 插槽、
		# 工艺、
		# 核心电压、
		# 系列、
		# 型号、
		# 步进、
		# 扩展系列、
		# 扩展型号、
		# 修订、
		# 时钟（核心#0）、
		# 缓存、
		# 核心速度、
		# 一级数据、
		# 倍频、
		# 一级指令、
		# 总线速度、
		# 二级、
		# 额定FSB、
		# 三级
	return 'CPU', result_info


def get_ip():
	'''
	获取ip
	return:
		ip地址
	'''
	hostname = socket.gethostname()
	ip = is_None(socket.gethostbyname(hostname))
	return 'ip', {'ip':ip}


def memory_info():
	'''
	获取内存相关参数
	return:
		内存类型、通道数、大小、频率
	'''
	result_info = {}
	memory_list = []
	memory_DataWidth = 0

	for _memory in c.Win32_PhysicalMemory():
		memory_list.append(_memory.Description)
		memory_DataWidth += int(_memory.Capacity) if _memory.Capacity else 0

	result_info['内存类型'] = ''
	result_info['通道数'] = is_None(len(c.Win32_PhysicalMemory()))
	result_info['大小'] = is_None((
		memory_DataWidth // 1048576) if memory_DataWidth else 0)
	result_info['频率'] = ''
	# print(result_info)
	return '内存', result_info


def sys_version():
	'''
	获取系统信息
	return:
		名称、位
	'''
	result_info = {}
	for sys in c.Win32_OperatingSystem():
		result_info['名称'] = is_None(sys.Caption)
		result_info['位'] = is_None(sys.OSArchitecture)
		return 'OS', result_info


def get_net_io():
	'''
	获取网络io
	return:
	    网络io
	'''
	result_info = {}
	net = psutil.net_io_counters()
	# bytes_sent = '{0:.2f} Mb'.format(net.bytes_recv / 1024 / 1024)
	# bytes_rcvd = '{0:.2f} Mb'.format(net.bytes_sent / 1024 / 1024)
	bytes_sent = '0 Mb'
	bytes_rcvd = '0 Mb'
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
	# bytes_read = '{0:.2f} Gb'.format(io.read_bytes / 1024 / 1024 / 1024)
	# bytes_write = '{0:.2f} Gb'.format(io.write_bytes / 1024 / 1024 / 1024)
	bytes_read = '0 Gb'
	bytes_write = '0 Gb'
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
			   pool.apply_async(func=get_net_io,), 
			   pool.apply_async(func=get_dist_io,)
			   ]
	pool.close()
	pool.join()
	cp = {}
	for _r in multi_result:
		cp[_r.get()[0]] = _r.get()[1]
	# sys.stdout.detach()
	# sys.stdout = io.TextIOWrapper(sys.stdout.detach(),encoding='utf-8')
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
