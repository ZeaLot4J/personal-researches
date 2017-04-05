package com.zl.ui;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;

import com.zl.util.MyNotify;

public class ChatterExitTask implements Runnable {
	private byte[] buf;
	private DatagramPacket dp;
	private DatagramSocket ds;
	private MyNotify myNotify;
	
	public ChatterExitTask(MyNotify myNotify) {
		this.myNotify = myNotify;
	}

	@Override
	public void run() {
		buf = new byte[1024];
		dp = new DatagramPacket(buf,buf.length);//UDP数据报
		try {
			ds = new DatagramSocket(ChatterUI.EXIT_PORT);
			while(true){
				ds.receive(dp);//会阻塞
				System.out.println(dp.getAddress());
				System.out.println(dp.getPort());
				System.out.println(new String(dp.getData()));
				
				String receivingMessage = new String(buf,0,dp.getLength());
				
				if("bye".equals(receivingMessage)){
					InetAddress remoteAddress = dp.getAddress();
					if(myNotify!=null){
						ChatterResult cr = new ChatterResult();
						cr.content = receivingMessage;
						cr.addr = remoteAddress;
						System.out.println(cr);
						myNotify.notifyResult(cr);
					}
					
				}
				
			}
		} catch (Exception e) {
			e.printStackTrace();
		} 
	}

}
