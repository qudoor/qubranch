QuBranch
---

[![Documentation Status](https://img.shields.io/badge/docs-latest-brightgreen.svg)](http://developer.queco.cn/learn/doc/detail?id=12&childrenid=14)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

### **概述**
---


- QuBranch 是一款量子计算编程 IDE 软件，包括编辑、调试、量子模拟执行等功能，为量子计算编程提供一站式集成开发环境。
- QuBranch 基于 VS Code 源码开发，以插件形式提供扩展功能，支持 mac、windows、linux 等多种平台。
- QuBranch 结合量子编程框架 QuTrunk，可使用本机进行量子计算模拟或配置使用远程计算资源。在默认不做配置的情况下，编写的量子程序调用的是本地计算机资源。

- QuBranch 内置 QuComposer 功能，进行拖拽式可视化量子编程。QuComposer 是 QuBranch 的可视化功能模块，可以同时支持图形编辑、代码编辑两种方式绘制量子电路功能，实现量子电路图与代码双侧联动。

### **QuBranch环境搭建与安装**
---

#### 1.环境搭建

1.1 需要先安装 node 环境，可安装 nvm、node 版本管理工具

1.2 需要预装 yarn

```
npm i -g yarn
```

1.3 安装 yrm（yarn 及 npm 源切换使用）

1.4 需要预装 windows-build-tools （将会预装 python2.7，若安装卡住，可在%temp%目录下创建一个名为 dd*client*.log 的文件，加入一行 Closing installer. Return code: 3010.然后保存。）

```
npm install --global windows-build-tools
```

1.5 需要预装 [VC Build Tools](https://docs.microsoft.com/zh-cn/visualstudio/releases/2019/history)

1.6 执行命令，切换至对应的 vs 版本

```
npm config set msvs_version 2019
```

1.7 拉取 IDE 代码后，执行 yarn 安装依赖（安装依赖时若遇到请求超时可使用 yrm 切换至国内镜像，并且请保证 github 的连接通畅，若遇 electron 打包超时，可切换 electron 源 yarn config set ELECTRON_BUILDER_BINARIES_MIRROR http://npm.taobao.org/mirrors/electron-builder-binaries/

#### 2.下载与安装

QuBranch 安装前提是本地已安装好 Python 环境安装，当前软件包按 python3.10 环境开发，下载地址[python3.10 官网](https://www.python.org/)下载，Windows 系统的下载如下：

- 下载地址：[QuBranch 下载](http://developer.queco.cn/download/list)

- 下载完成后，双击 QuIDESetup.exe，根据界面提示执行各步骤就可以完成安装。

- QuTrunk 下载及安装详情见：[QuTrunk 下载及安装](http://developer.queco.cn/learn/doc/detail?id=12&childrenid=14)

### **QuBranch日常开发及编译命令**
---

- `yarn watch` 打开 QuBranch 桌面版的热更新、执行`./scripts/code.bat`（linux 上是`./scripts/code.sh`）启动项目。
- `yarn gulp --task` 查看 gulp 的任务

### **编程示例**
---

#### 1.可视化量子编程

1.1 构建一个简单的贝尔态量子线路：

首先拖动 H 门作用于第一个量子位；其次拖动 CNOT 门作用于第一个和第二个量子位，选择测量符号得到如图所示结果。

1.2 结果如下：

如下图中，拖动量子门操作后，右侧代码区域自动生成相应代码；下方概率统计区域自动显示量子态对应概率。

![](http://developer.queco.cn/media/images/QuComposerBeiErDianLu.original.jpg)

#### 2.QuTrunk 量子编程

2.1 量子计算 Demo 程序编写及运行

从开始界面，选择新建 python 文件，并保存为 demo.py,下面的代码为 bell_pair 算法例子：

    from qutrunk.circuit import QCircuit
    from qutrunk.circuit.gates import H, CNOT, Measure

    qc = QCircuit()
    qr = qc.allocate(2) # allocate

    H * qr[0] # apply gate
    CNOT * (qr[0], qr[1])
    Measure * qr[0]
    Measure * qr[1]

    res = qc.run(shots=1024) # run circuit
    print(res.get_counts()) # print result

    qc.draw() #print quantum circuit

2.2 上面程序运行结果如下：

![](http://developer.queco.cn/media/images/demoChengXuYunXingJieGuo.original.jpg)

程序结果说明如下：

- "[{"00": 509}, {"11": 515}]": 为量子线路运行统计结果，因为指明了线路运行 1024 次， 所以输出的结果为：出现“00”的次数为 509；出现“11”的次数为 515。

- 下面的是输出的量子线路图，q[0] 和 q[1]是两个量子比特分别作用 H 门，CX 门然后分别实施测量。

### **文档教程**
---

详见启科量子开发者官方文档：[QuBranch 安装及使用教程](http://developer.queco.cn/learn/doc/detail?id=12&childrenid=14)

### **如何参与开发**
---

1. 阅读源代码，了解我们当前的开发方向
2. 找到自己感兴趣的功能或模块
3. 进行开发，开发完成后自测功能是否正确
4. Fork 代码库，将修复代码提交到 fork 的代码库
5. 发起 pull request
6. 更多详情请参见[链接](./CONTRIBUTING.md)

### **许可证**
---

QuBranch 是自由和开源的，在 MIT 许可证版本下发布。
