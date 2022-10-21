import argparse
import subprocess
import pathlib
import time
import os
import threading
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
        self.Algorithm_dict = {'grover': '/root/QuIDE/groversearch'}
        self.status_code = 0
        self.start_time = None
        self.end_time = None
        self.cpu_info_list = []
        self.ram_info_list = []
        self.job_id_list = []
        self.job_id_info = {}


    def chage_str(self, l):
        l = l.split(' ')
        while '' in l:
            l.remove('')
        return l

    # 内存使用率
    def get_ram_info(self):
        output = subprocess.getoutput('free -t')
        # time_d = subprocess.getoutput('date')
        t, Mem, Swap, Total = output.split('\n')
        t = self.chage_str(t)
        Mem = self.chage_str(Mem)
        Swap = self.chage_str(Swap)
        Total = self.chage_str(Total)
        a = {'Mem': {'total':Mem[1],'used':Mem[2], 'free':Mem[3] , 'shared':Mem[4], 'buff/cache':Mem[5], 'available':Mem[6]},
            'Swap': {'total':Swap[1],'used':Swap[2], 'free':Swap[3] },
            'Total': {'total':Total[1],'used':Total[2], 'free':Total[3]}
            }
        return a

    # 取得cpu使用率
    def get_cpu_info(self):
        output = subprocess.getoutput('mpstat 1 1 -P ALL')
        output = output.split('\n平均时间')[0].split('\n')
#        output = output.split('\n')
        cpuDetail = []
        n = 0
        for i in range(len(output)):
            n += 1
            if n < 4:
                continue
            if output[i] == '':
                continue
            a = []
            c = 0
            for j in output[i].split(' '):
                if c == 3:
                    continue
                if j != '':
                    c += 1
                    a.append(j)
            cpuDetail.append(a)
        return cpuDetail


    # 记录系统资源消耗
    def system_info(self, jobid, dir, algo,qb,r):
        file_name = os.path.join(dir,f'{algo}_{qb}-{r}.txt')
        while True:
            output = subprocess.getoutput(f'squeue --job {jobid}')
            if jobid not in output:
                self.job_id_list.remove(jobid)
                t = self.job_id_info[file_name].split(":")
                t = int(t[0])*60 + int(t[1])
                a = str({
                    "algorithm": algo,
                    "now_qubit": qb,
                    "now_round": r,
                    "data":{
                        "time": t,
                        # "ram": self.ram_mean(self.ram_info_list),
                        # "cpu": self.cpu_mean(self.cpu_info_list),
                        }
                    }).replace("'", '"')
                with open(file_name,"w+") as f:
                    f.write(a)
                break
            a = output.split('\n')[1].split(' ')
            b = []
            for i in a :
                if i:
                    b.append(i)

            self.job_id_info[file_name] = b[5]

            time.sleep(1)

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
        for ge in range(n):
            b[ge][2] = float(b[ge][2]) / mean
        return b

    # 运行时cpu资源平均情况
    def ram_mean(self, a):
        # 取总共多少列数据
        mean = len(a)
        b = a[0]
        # 删除第一列
        a.pop(0)

        for i in a:
            b['Mem']['total'] = int(i['Mem']['total']) + int(b['Mem']['total'])
            b['Mem']['used'] = int(i['Mem']['used']) + int(b['Mem']['used'])
            b['Mem']['free'] = int(i['Mem']['free']) + int(b['Mem']['free'])
            b['Mem']['shared'] = int(i['Mem']['shared']) + int(b['Mem']['shared'])
            b['Mem']['buff/cache'] = int(i['Mem']['buff/cache']) + int(b['Mem']['buff/cache'])
            b['Mem']['available'] = int(i['Mem']['available']) + int(b['Mem']['available'])

            b['Swap']['total'] = int(i['Swap']['total']) + int(b['Swap']['total'])
            b['Swap']['used'] = int(i['Swap']['used']) + int(b['Swap']['used'])
            b['Swap']['free'] = int(i['Swap']['free']) + int(b['Swap']['free'])

            b['Total']['total'] = int(i['Total']['total']) + int(b['Total']['total'])
            b['Total']['used'] = int(i['Total']['used']) + int(b['Total']['used'])
            b['Total']['free'] = int(i['Total']['free']) + int(b['Total']['free'])

        b['Mem']['total'] = int(b['Mem']['total']) / mean
        b['Mem']['used'] = int(b['Mem']['used']) / mean
        b['Mem']['free'] = int(b['Mem']['free']) / mean
        b['Mem']['shared'] = int(b['Mem']['shared']) / mean
        b['Mem']['buff/cache'] = int(b['Mem']['buff/cache']) / mean
        b['Mem']['available'] =  int(b['Mem']['available']) / mean

        b['Swap']['total'] = int(b['Swap']['total']) / mean
        b['Swap']['used'] = int(b['Swap']['used']) / mean
        b['Swap']['free'] = int(b['Swap']['free']) / mean

        b['Total']['total'] = int(b['Total']['total']) / mean
        b['Total']['used'] = int(b['Total']['used']) / mean
        b['Total']['free'] = int(b['Total']['free']) / mean
        return b


    # 写为slurm脚本
    def write_sh_file(self, file_name, s):
        with open(file_name, "w+") as f:
            for i in s:
                f.write(i+'\n')


    # 程序入口
    def start_run(self, algo_list, qb_list, round, dir):
        '''
        args:
            qb_list: list [1,3,5] 比特数列表
            round: int 轮数
            dir: str 存放数据的目录 \
                /QuIDE/user_list/dasges/1648878518_tag_my_job_name
        1. 创建文件
        2. 存储算法运行时的计算机使用资源数据
        '''
        file_name_status = os.path.join(dir,'0.txt')  # 用于标记程序是否运行中，0运作中，1结束
        self.mk_file(file_name_status)  # 创建文件

        for algo in algo_list:
            for qb in qb_list:  # 比特数
                for r in range(round): # 跑多少轮
                    r += 1
                    r_file =  os.path.join(dir,f'{algo}_{qb}-{r}.out')  # 重定向输出的文件
                    
                    cmd = f'{self.Algorithm_dict[algo]} -n {qb} > {r_file}'  # 执行算法的命令
                    
                    file_name = os.path.join(dir,f'{algo}_{qb}-{r}.sh')
                    self.mk_file(file_name)  # 创建文件

                    file_str = [
                        '#!/bin/bash',
                        '#SBATCH -o ' + r_file,
                        f'mpirun {self.Algorithm_dict[algo]} -n {qb} &',
                        'wait'
                    ]
                    
                    self.write_sh_file(file_name, file_str)

                    jobid = subprocess.getoutput(f'sbatch {file_name}')
                    jobid = jobid.replace('Submitted batch job ', '')
                    self.job_id_list.append(jobid)

                    # 启动一个子进程获取实时系统资源
                    self.start_time, self.end_time, self.cpu_info_list, self.ram_info_list = None, None, [], []
                    t1 = threading.Thread(target=self.system_info, args=(jobid,dir, algo,qb,r,))
                    t1.start()


        # 改变文件状态
        while True:
            if self.job_id_list == []:
                break
            time.sleep(1)

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
                'job_name': dir.split('_tag_')[-1],  # 任务名称
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
    parser = argparse.ArgumentParser()
    # parser.add_argument("-n", "--num", help="Increase output Bits")  # 比特数
    parser.add_argument("-r", "--round", type=int, help="Round Number")  # 轮数
    parser.add_argument("-s", "--step", help="Step Number")  # 步长(相当于比特数，用逗号分割)
    parser.add_argument("-a", "--algo", help="Increase output Algorithm")  # 算法名称
    parser.add_argument("-p", "--path", help="Save path")  # 算法名称
    args = parser.parse_args()

    if args.round and args.round and args.step and args.algo :
        start_to_run = test_run()  # 实例化
        qb_list = (args.step).replace(" ",'').split(',')  # 切割比特数
        algo_list = (args.algo).replace(" ",'').split(',') 
        start_to_run.start_run(algo_list, qb_list, args.round, args.path)  #开始执行


                
            









    



