package com.zl.ui;

import java.net.DatagramPacket; 
import java.net.DatagramSocket;
import java.net.InetAddress;

import com.zl.util.MyNotify;

public class ChatterTask implements Runnable{
	private MyNotify myNotify;
	private byte[] buf; //接收用的字节数组 
	private DatagramPacket dp;//数据包
	private DatagramSocket ds;//UDP数据报套接字
	private int localPort = 10003;
	class ChatterResult{
		public String content;
		public InetAddress addr;
	}
	
	public ChatterTask(MyNotify myNotify){
		this.myNotify = myNotify;
	}
	@Override
	public void run() {
		buf = new byte[1024];
		dp = new DatagramPacket(buf,buf.length);//UDP数据报
		try {
			ds = new DatagramSocket(localPort);
			while(true){
				ds.receive(dp);//会阻塞
				System.out.println(dp.getAddress());
				System.out.println(dp.getPort());
				System.out.println(new String(dp.getData()));
				
				String receivingMessage = new String(buf,0,dp.getLength());
				InetAddress remoteAddress = dp.getAddress();
				
				if(myNotify!=null){
					ChatterResult cr = new ChatterResult();
					cr.content = receivingMessage;
					cr.addr = remoteAddress;
					myNotify.notifyResult(cr);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		} 
	}
}
class ChatterResult{
	public String content;
	public InetAddress addr;
}