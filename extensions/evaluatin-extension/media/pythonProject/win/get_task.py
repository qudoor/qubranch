import os
import time
import pathlib
def get_task():
    '''
    获取所有任务列表
    '''
    work_dir=os.path.dirname(os.path.realpath(sys.argv[0]))
    dir = os.path.join(work_dir, 'run_data')

    task = []
    for root, dirs, files in os.walk(dir):
        # print(dirs) #当前路径下所有子目录
        if dirs:
            for i in dirs:
                t = i.split('_!tag_')[0]
                j = i.split('_!tag_')[1]
                timeStamp = int(t)
                timeArray = time.localtime(timeStamp)
                otherStyleTime = time.strftime("%Y/%m/%d %H:%M:%S", timeArray)
                # print(otherStyleTime)
                status = "未开始"
                if os.path.exists(os.path.join(dir,i,'0.txt')):
                    status = "任务进行中"
                elif os.path.exists(os.path.join(dir,i,'1.txt')):
                    status = "任务已完成"
                task.append({'tag':t,'job': j, 'time': otherStyleTime, 'status': status})
        break
    return str(task).replace("'", '"')

import sys
print(get_task())
sys.stdout.flush()
