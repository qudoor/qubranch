# -*- coding: utf-8 -*-
import time
import paramiko
import argparse
parser = argparse.ArgumentParser()

def login(ip, port, user, pwd):
    # 创建一个ssh对象
    client = paramiko.SSHClient()

    # 如果之前没有,连接过的ip,会出现选择yes或者no的操作,自动选择yes
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy)

    # 连接服务器
    client.connect(hostname=ip, # 主机地址
                port=port, # ssh端口
                username=user, # 用户名
                password=pwd, # 密码
                allow_agent=False,
                look_for_keys=False
                )
    return client


def get_file(client):
    '''
    拉取文件
    '''
    tran=client.get_transport()
    sftp = paramiko.SFTPClient.from_transport(tran)
    remotepath = '/home/greatwall/桌面/socker_test/dist/web_socket'
    localpath = 'web_socket'
    sftp.get(remotepath, localpath)



def put_file(remotepath, localpath):
    '''
    推送文件
    '''
    tran=client.get_transport()
    sftp = paramiko.SFTPClient.from_transport(tran)
    sftp.put(localpath, remotepath)
    client.exec_command('chmod 777 ' + remotepath)


def main(client):
    '''
    1. 查看根目录下是否有quide文件夹
    2. 推送脚本至quide
    3. 启动推送的脚本
    '''

    # 执行命令，查看是否有quide文件夹
    stdin,stdout,stderr = client.exec_command('cd /root && ls')

    # 获取结果
    result=stdout.read().decode('utf-8')

    # 判断是否需要创建文件夹
    if 'QuIDE' not in result.split('\n'):
        client.exec_command('mkdir /root/QuIDE')

    # 推送文件
    put_file('/root/QuIDE/groversearch', 'groversearch')
    put_file('/root/QuIDE/Algorithm_job_slurm', 'Algorithm_job_slurm')

    # 启动服务
    # web_socket = {'port':'21567',
    #     'cmd': 'nohup /QuIDE/web_socket>/QuIDE/web_socket.log 2>&1 &',
    #     'remotepath': '/QuIDE/web_socket',
    #     'localpath': 'web_socket'
    #     }
    fastapi_server = {'port':'21568',
        'cmd': 'nohup /root/QuIDE/fastapi_server>/root/QuIDE/fastapi_server.log 2>&1 &',
        'remotepath': '/root/QuIDE/fastapi_server',
        'localpath': 'fastapi_server'
        }
    # strat_server(client, web_socket)
    strat_server(client, fastapi_server)

def strat_server(client, server_dict):
    stdin,stdout,stderr = client.exec_command('lsof -i:'+server_dict['port'])
    result=stdout.read().decode('utf-8')
    temp_l = []
    if 'PID' in result:
        for i in result.split('\n')[1].split(' '):
            if i:
                temp_l.append(i)
        stdin,stdout,stderr = client.exec_command('kill -9 '+temp_l[1])

    # 推送文件
    put_file(server_dict['remotepath'], server_dict['localpath'])
    client.exec_command(server_dict['cmd'])


def check_port( p):
    '''
    检查任务是否启动
    '''
    a = 0
    while True:
        if a > 10:
            return None
        stdin,stdout,stderr = client.exec_command('lsof -i:' + p)
        result=stdout.read().decode('utf-8')
        if p in result:
            return 1
        a+=1
        time.sleep(1)


if __name__ == "__main__":
    '''
    把相关文件脚本推送至远程服务器，并启动文件脚本

    该脚本执行命令：

    '''
    # 获取输入的参数
    parser.add_argument("--ip")
    parser.add_argument("--port", type=int, default=22)
    parser.add_argument("--user", type=str)
    parser.add_argument("--pwd", type=str)

    args = parser.parse_args()
    if args.ip and args.port and args.user and args.pwd:
        # 链接远程服务器
        client = login(args.ip, args.port, args.user, args.pwd)

        # 开始执行操作
        main(client)

        # 检查服务是否启动成功
        if check_port('21568'):
            print(1, end='')  # 成功打印1
        else:
            print(0, end='')

    #关闭链接
        client.close()
    else:
        print('miss args')


