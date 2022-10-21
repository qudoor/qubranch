import argparse
import subprocess
import os
import json
import sys


def get_cpu_info():
    '''
    获取CPU参数
	return:
    	cpu所需字段:CPU型号、主频、核心数、线程数、L1 Cache、L2 Cache、指令集
    '''
    cpu_info = {}
    output = subprocess.getoutput('sysctl machdep.cpu')
    for i in output.replace('：',':').split('\n'):
        cpu_info[i.split(':')[0]] = i.split(':')[1].lstrip()
    return cpu_info


def read_file(file_name):
    if os.path.exists(file_name):
        f = open(file_name)
        lines = f.readline()
        return json.loads(lines)
    return {}


def get_result(job: str, tag: str):

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
    work_dir=os.path.dirname(__file__)

    dir = os.path.join(work_dir, 'run_data', tag+'_!tag_'+job) 
    file_name = os.path.join(dir, '1.txt')
    co_file = read_file(file_name)
    task = {
        'cpu_thread': get_cpu_info()['machdep.cpu.thread_count'],
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
                all_round_dict[str(r)] = read_date  # 这轮的详情数据

                time_best_or_last.append((r, float(read_date['data']['time'])))
                cpu_best_or_last.append((r, read_date['data']['cpu'][0][-1]))
                u = (float(read_date['data']['ram']['Total']['used']))*100 / (float(read_date['data']['ram']['Total']['total']))
                ram_best_or_last.append((r, u))
                data_cpu += read_date['data']['cpu'][0][-1]
                data_ram += float(read_date['data']['ram']['Total']['used'])
                data_time += float(read_date['data']['time'])  # 所有用时

            time_best_or_last.sort(key=lambda x:x[1])  # 按时间排序轮次
            cpu_best_or_last.sort(key=lambda x:x[1])  # 按cpu排序
            ram_best_or_last.sort(key=lambda x:x[1])  # 按ram排序

            qb_dict[qb] = {
                'all_round_details': all_round_dict,
                'average_time': data_time / co_file['round'],  # 批轮次平均时间
                'average_cpu': data_cpu / co_file['round'],  # 批轮次平均时间
                'average_ram': (data_ram / co_file['round'])*100 / float(read_date['data']['ram']['Total']['total']),  # 批轮次平均时间
                'time_best': [time_best_or_last[0][0], time_best_or_last[0][1]],  # 此批时间最快
                'time_last': [time_best_or_last[-1][0], time_best_or_last[-1][1]],  # 此批时间最慢
                'cpu_best': [cpu_best_or_last[0][0], cpu_best_or_last[0][1]],  # 此批资源最低
                'cpu_last': [cpu_best_or_last[-1][0], cpu_best_or_last[-1][1]],  # 此批时间最高
                'ram_best': [ram_best_or_last[0][0], ram_best_or_last[0][1]],  # 此批资源最低
                'ram_last': [ram_best_or_last[-1][0], ram_best_or_last[-1][1]],  # 此批时间最高
            }
        algo_dict[algo] = qb_dict

    task['all_algo_data'] = algo_dict
            
    return task
if __name__ =='__main__':
    '''
    python3 get_result.py --tag 1652600819 --job myjobname
    '''
    parser = argparse.ArgumentParser()
    parser.add_argument("--tag")
    parser.add_argument("--job")
    args = parser.parse_args()

    if args.tag and args.job:
        print(str(get_result(args.job, args.tag)).replace("'", '"'),end="")
        sys.stdout.flush()