import json
import subprocess
from fastapi import FastAPI
import uvicorn
import threading
import os, time
from fastapi import APIRouter, Cookie, Header
from typing import Optional, List
from fastapi.responses import JSONResponse
import random, string
from starlette.middleware.cors import CORSMiddleware
import shutil

app = FastAPI()
#设置允许访问的域名
origins = ["*"]  #也可以设置为"*"，即为所有。

#设置跨域传参
app.add_middleware(
    CORSMiddleware, 
    allow_origins=origins,  #设置允许的origins来源
    allow_credentials=False,
    allow_methods=["*"],  # 设置允许跨域的http方法，比如 get、post、put等。
    allow_headers=["*"]) 


def get_gpu_info():
    return {'xinghao': 'GeForce RTX 3090', 'suanli': '5467.86', 'zhupin': '1400MHz'}

def get_ram_info():
    ram_info = {}
    output = subprocess.getoutput('echo "123123" | sudo -S dmidecode -t memory | head -45 | tail -23')
    for i in output.replace('[sudo] greatwall 的密码：', '').replace('\t','').split('\n'):
        ram_info[i.split(': ')[0]] = i.split(': ')[1]
    output = subprocess.getoutput('grep MemTotal /proc/meminfo').replace('      ','')
    ram_info[output.split(': ')[0]] = output.split(': ')[1]
    return ram_info

def get_cpu_info():
    cpu_info = {}
    output = subprocess.getoutput('lscpu')
    for i in output.replace('：',':').split('\n'):
        cpu_info[i.split(':')[0]] = i.split(':')[1].lstrip()
    return cpu_info

def get_os_info():
    return subprocess.getoutput('cat /proc/version')

# @app.post('/start_job')
# def start_job(job: str, al: str, qubit: str, ip: str, tag: str, l: str):
#     # job :唯一标识
#     # 获取当前文件路径
#     dir = os.path.join(os.getcwd(), job)
#     os.makedirs(dir)
#     os.system('python3 test_grover.py --n {qubit} --j {job}'.format(qubit=qubit, job=job))
#     return {'response': 'start'}

# 获取硬件信息
@app.get("/get_info/{username}")
async def get_info(username):
    return {"cpu_info": get_cpu_info(),
            "ram_info": get_ram_info(),
            "gpu_info": get_gpu_info(),
            "os_info": get_os_info()}


@app.get("/login_user")
async def get_user(user_agent:Optional[str] = Header(None,convert_underscores=True),
        userId:Optional[str] = Header(None)):
    a_list = []
    if userId not in a_list:
        userId = ''.join(random.sample(string.ascii_letters + string.digits, 8))
        return JSONResponse(headers={"userId":userId})

# 触发任务
@app.post('/start_job')
def start_job(job: str, al: str, qubit: str, ip: str, l: str,
            user_agent:Optional[str] = Header(None,convert_underscores=True),
            userId:Optional[str] = Header(None)):
    '''
    args:
        job: 任务名称
        al: 算法名称
        qubit: 比特数[1,3,5]
        l: 轮数
    '''
    # job :唯一标识

    # 获取当前文件路径
    tag = str(int(time.time()))
    dir = os.path.join('/root/QuIDE', 'user_list', userId, tag+'_tag_'+job)  # 数据存放路径
    cmd = f'/root/QuIDE/Algorithm_job_slurm -r {l} -s {qubit} -a {al} -p {dir}'
    # print(cmd)
    # python3 /root/QuIDE/Algorithm_job_slurm.py -r 3 -s 10,11,12 -a grover -p /root/QuIDE/user_list/dasges/1652801015_tag_my_job_name
    # cmd = 'python3 /root/QuIDE/test_grover.py --n {qubit} --p {path}'.format(qubit=qubit, path=dir)
    if os.path.exists(dir):
        shutil.rmtree(dir)
    else:
        os.makedirs(dir)
        t1 = threading.Thread(target=os_cmd, args=(cmd,))
        t1.start()

    return {"tag": tag}

def os_cmd(cmd):
    os.system(cmd)


# 获取任务列表
@app.get('/get_task')
async def get_task(user_agent:Optional[str] = Header(None,convert_underscores=True),
            userId:Optional[str] = Header(None)):
    task = []
    for root, dirs, files in os.walk(os.path.join('/root/QuIDE', 'user_list',userId)):
        # print(dirs) #当前路径下所有子目录
        if dirs:
            for i in dirs:
                t = i.split('_tag_')[0]
                j = i.split('_tag_')[1]
                timeStamp = int(t)
                timeArray = time.localtime(timeStamp)
                otherStyleTime = time.strftime("%Y/%m/%d %H:%M:%S", timeArray)
                # print(otherStyleTime)
                status = "未开始"
                if os.path.exists(os.path.join('/root/QuIDE', 'user_list',userId,i,'0.txt')):
                    status = "任务进行中"
                elif os.path.exists(os.path.join('/root/QuIDE', 'user_list',userId,i,'1.txt')):
                    status = "任务已完成"
                task.append({'tag':t,'job': j, 'time': otherStyleTime, 'status': status})
        break
    return task

# 取得测评结果
@app.get('/get_result')
async def get_result(job: str, tag: str,
        userId:Optional[str] = Header(None)):

    '''
    构建的数据结构
    {
        'qubit': ['10', '11', '12'],  用多少比特跑
        'job_name': 'my_job_name',  任务名称
        'round': 3  多少轮
        'all_algo_data': {
            '算法名称': {
                all轮详情:{
                    '1 当前轮详情': {
                    }
                },
                '全部平均时间': '',
                '最佳': '',
                '最烂': ''
                },

            }
        }
    }
    '''
    file_name = os.path.join('/root/QuIDE', 'user_list',userId, "%s_tag_%s"%(tag, job), '1.txt')
    co_file = read_file(file_name)
    task = {
        'qubit': co_file['qubit'],
        'job_name': co_file['job_name'],
        'round': co_file['round']
    }
    algo_dict = {}
    for algo in co_file['algorithm']:
        qb_dict = {}
        for qb in co_file['qubit']:
            time_best_or_last = []  # 用于计算最快最慢轮次
            cpu_best_or_last = []  # 用于计算最快最慢轮次
            ram_best_or_last = []  # 用于计算最快最慢轮次
            data_time = 0  # 用于计算这批轮次的平均时间
            data_cpu = 0  # 用于计算这批轮次的平均cpu使用率
            data_ram = 0  # 用于计算这批轮次的平均ram使用率
            all_round_dict = {}
            for r in range(co_file['round']):
                r += 1
                read_date = read_file(file_name.replace('1.txt', f'{algo}_{qb}-{r}.txt'))
                read_date
                all_round_dict[r] = read_date  # 这轮的详情数据
                
                time_best_or_last.append((r, read_date['data']['time'] ))
                # cpu_best_or_last.append((r, read_date['data']['cpu'][0][-1]))
                # u = (float(read_date['data']['ram']['Total']['used']))*100 / (float(read_date['data']['ram']['Total']['total']))
                # ram_best_or_last.append((r, u))
                # data_cpu += read_date['data']['cpu'][0][-1]
                # data_ram += float(read_date['data']['ram']['Total']['used'])
                data_time += read_date['data']['time'] # 所有用时

            time_best_or_last.sort(key=lambda x:x[1])  # 按时间排序轮次
            # cpu_best_or_last.sort(key=lambda x:x[1])  # 按cpu排序
            # ram_best_or_last.sort(key=lambda x:x[1])  # 按ram排序

            qb_dict[qb] = {
                'all_round_details': all_round_dict,
                'average_time': data_time / co_file['round'],  # 批轮次平均时间
                # 'average_cpu': data_cpu / co_file['round'],  # 批轮次平均时间
                # 'average_ram': (data_ram / co_file['round'])*100 / float(read_date['data']['ram']['Total']['total']),  # 批轮次平均时间
                'time_best': time_best_or_last[0],  # 此批时间最快
                'time_last': time_best_or_last[-1],  # 此批时间最慢
                # 'cpu_best': cpu_best_or_last[0],  # 此批资源最低
                # 'cpu_last': cpu_best_or_last[-1],  # 此批时间最高
                # 'ram_best': ram_best_or_last[0],  # 此批资源最低
                # 'ram_last': ram_best_or_last[-1],  # 此批时间最高
            }
        algo_dict[algo] = qb_dict

    task['all_algo_data'] = algo_dict
            
    return task

def read_file(file_name):
    if os.path.exists(file_name):
        f = open(file_name)
        lines = f.readline()
        return json.loads(lines)
    return {}

# result
if __name__ == "__main__":
    uvicorn.run("fastapi_server:app", host="0.0.0.0", port=21568)