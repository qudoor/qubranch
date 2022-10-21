import argparse
import shutil, psutil
import subprocess
import pathlib
import time
import os
import threading
import sys
import multiprocessing
'''
1.开始计时
2.运行代码测试
3.记录系统资源消耗
4.代码运行结束
5.结束计时
6.结束记录系统资源消耗
'''

class test_run(object):
    def __init__(self) -> None:
        work_dir=os.path.dirname(os.path.realpath(sys.argv[0]))
        self.Algorithm_dict = {'grover': os.path.join(work_dir, 'grover-win/groversearch.exe')}
        self.status_code = 0
        self.start_time = None
        self.end_time = None
        self.cpu_info_list = []
        self.ram_info_list = []
        self.cpu_num = psutil.cpu_count()  # 取得cpu数量
        

    def chage_str(self, l):
        l = l.split(' ')
        while '' in l:
            l.remove('')
        return l

    # 内存使用率
    def get_ram_info(self):
        
        ram = psutil.virtual_memory()
        return {"Total": {'total': ram.total, 'free':  ram.free, 'used': ram.used}}

    # 取得cpu使用率
    def get_cpu_info(self,t):
        
        percpu = psutil.cpu_percent(interval=1, percpu=True)  # 取得所有cpu资源使用情况
        cpu_m = []  # 改变数据结构 ：[['16时25分53秒', 'all', '12.4'], ['16时25分53秒', '0', '16.9']]
        a_cpu = 0  # 记录这个cpu的使用情况，以便计算总cpu
        for i in range(self.cpu_num):
            a_cpu += percpu[i]
            cpu_m.append([t,str(i),str(percpu[i])])
        return [[t, 'all', str(round((a_cpu/self.cpu_num), 1))]] + cpu_m  # 所有cpu平均资源 + 每个cpu具体资源


    # 记录系统资源消耗
    def system_info(self,file_name):
        while os.path.exists(file_name):
            t = time.strftime('%H时%M分%S秒', time.localtime(time.time()))
            cp = self.get_cpu_info(t)
            self.cpu_info_list.append(cp)
            #self.get_cpu_info()
            ra = self.get_ram_info()
            self.ram_info_list.append(ra)


    # 创建文件
    def mk_file(self, file_name):
        if os.path.exists(file_name):
            os.remove(file_name)
        else:
            # file_name = "0.txt"
            pathlib.Path(file_name).touch()

    # 运行时cpu资源平均情况
    def cpu_mean(self, a):
        mean = len(a)
        b = a[0]
        a.pop(0)
        n = len(b)
        for zong in a:
            for ge in range(n):
                b[ge][2] = float(b[ge][2]) + float(zong[ge][2])
                # print(ge)
        for ge in range(n):
            b[ge][2] = float(b[ge][2]) / mean
        return b

    # 运行时ram资源平均情况
    def ram_mean(self, a):
        # 取总共多少列数据
        mean = len(a)
        b = a[0]
        # 删除第一个元素
        a.pop(0)

        for i in a:
            b['Total']['total'] = int(i['Total']['total']) + int(b['Total']['total'])
            b['Total']['used'] = int(i['Total']['used']) + int(b['Total']['used'])
            b['Total']['free'] = int(i['Total']['free']) + int(b['Total']['free'])

        b['Total']['total'] = int(b['Total']['total']) / mean
        b['Total']['used'] = int(b['Total']['used']) / mean
        b['Total']['free'] = int(b['Total']['free']) / mean
        return b


    # 程序入口
    def start_run(self, algo_list, qb_list, round, dir):
        '''
        args:
            qb_list: list [1,3,5] 比特数列表
            round: int 轮数
            dir: str 存放数据的目录 \
                /home/Quide/run_data/1648878518_!tag_my_job_name
        1. 创建文件
        2. 存储算法运行时的计算机使用资源数据
        '''
        file_name_status = os.path.join(dir,'0.txt')  # 用于标记程序是否运行中，0运作中，1结束
        self.mk_file(file_name_status)  # 创建文件
        for algo in algo_list:

            for qb in qb_list:  # 比特数
                for r in range(round): # 跑多少轮
                    r += 1
                    r_file =  os.path.join(dir,f'Qu_{qb}-{r}.tmp')  # 重定向输出的文件
                    cmd = f'{self.Algorithm_dict[algo]} -n {qb} > {r_file}'  # 执行算法的命令
                    if qb:
                        file_name = os.path.join(dir,f'{algo}_{qb}-{r}.txt')
                        self.mk_file(file_name)  # 创建文件

                        # 启动一个子进程获取实时系统资源
                        self.start_time, self.end_time, self.cpu_info_list, self.ram_info_list = None, None, [], []
                        t1 = threading.Thread(target=self.system_info, args=(file_name_status,))
                        t1.start()

                        # 开始执行算法
                        self.start_time = time.time()
                        output = subprocess.getoutput(cmd)
                        self.end_time = time.time()
                        time.sleep(1)
                        self.done_run(file_name, algo, qb, r)
                    
                    

        # 改变文件状态
        if os.path.exists(file_name_status):
            os.remove(file_name_status)  # 删除文件
        file_name_status = file_name_status.replace('0.txt','1.txt')  # 创建文件的路径
        # if os.path.exists(file_name_status):
        #     os.remove(file_name_status)
        # self.mk_file(file_name_status)  # 创建文件


        # 将job执行数据写入文件
        with open(file_name_status,"w+") as f:
            f.write(str(
            {
                'job_name': dir.split('_!tag_')[-1],  # 任务名称
                'algorithm': algo_list,  # 算法名称
                'round': round,  # 轮数
                'qubit': qb_list,  # 比特数
            }
        ).replace("'", '"'))
        

    # 结束时处理
    def done_run(self, file_name, Algo, qubit, round):
        '''
        args:
            file_name: 存放数据的文件
            algo: 算法名称
            qubit: 比特数
            round: 第几轮
        '''
        
        a = str({
            "algorithm": Algo,
            "now_qubit": qubit,
            "now_round": round,
            "data":{
                "time": self.end_time - self.start_time,
                "ram": self.ram_mean(self.ram_info_list),
                "cpu": self.cpu_mean(self.cpu_info_list),
                }
            }).replace("'", '"')

        with open(file_name,"w+") as f:
            f.write(a)


if __name__ == "__main__":
    multiprocessing.freeze_support()
    '''
    python3 Algorithm_job_mac.py --round 3 --step 5,6,8 --algo grover --job myjobname
    '''
    parser = argparse.ArgumentParser()
    # parser.add_argument("-n", "--num", help="Increase output Bits")  # 比特数
    parser.add_argument("-r", "--round", type=int, help="Round Number")  # 轮数
    parser.add_argument("-s", "--step", help="Step Number")  # 步长(相当于比特数，用逗号分割)
    parser.add_argument("-a", "--algo", help="Increase output Algorithm")  # 算法名称
    parser.add_argument("-j", "--job", help="Save path")  # 算法名称
    args = parser.parse_args()



    if args.round and args.round and args.step and args.job :
        work_dir = os.path.dirname(os.path.realpath(sys.argv[0]))
        tag = str(int(time.time()))
        print(tag, end='')
        sys.stdout.flush()
        dir = os.path.join(work_dir, 'run_data', tag+'_!tag_'+args.job)  # 数据存放路径
        if os.path.exists(dir):
            shutil.rmtree(dir)
        else:
            os.makedirs(dir)

        start_to_run = test_run()  # 实例化
        qb_list = (args.step).replace(" ",'').split(',')  # 切割比特数
        algo_list = (args.algo).replace(" ",'').split(',') 
        start_to_run.start_run(algo_list, qb_list, args.round,dir)  #开始执行


                
            









    



