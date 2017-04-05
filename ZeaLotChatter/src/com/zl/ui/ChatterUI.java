package com.zl.ui;

import org.eclipse.swt.widgets.Display;   
import org.eclipse.swt.widgets.Shell;
import org.eclipse.swt.widgets.Label;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.swt.SWT;
import org.eclipse.swt.widgets.Text;

import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.layout.FormLayout;
import org.eclipse.swt.layout.FormData;
import org.eclipse.swt.layout.FormAttachment;
import org.eclipse.swt.widgets.Table;
import org.eclipse.swt.widgets.TableColumn;
import org.eclipse.swt.widgets.TableItem;
import org.eclipse.swt.events.KeyAdapter;
import org.eclipse.swt.events.KeyEvent;

import com.zl.ui.ChatterTask.ChatterResult;
import com.zl.util.MyNotify;
import org.eclipse.swt.events.DisposeListener;
import org.eclipse.swt.events.DisposeEvent;
public class ChatterUI{

	protected Shell shlZealot;
	private Text text;
	private Text text_1;
	private Text text_3;
	private Text text_4;
	private Text text_5;
	private Table table;
	private ChatterResult cr;
	private Set<InetAddress> hashSet = new HashSet<InetAddress>();
	private Button button_2;
	private Button button_1;
	private Button button_3;
	public final static int EXIT_PORT = 12345;//监听退出端口
	/**
	 * Launch the application.
	 * @param args
	 */
	public static void main(String[] args) {
		try {
			ChatterUI window = new ChatterUI();
			window.open();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	/**
	 * Open the window.
	 */
	public void open() {
		Display display = Display.getDefault();
		createContents();
		shlZealot.open();
		shlZealot.layout();
		
		Thread t = new Thread(new ChatterTask(new MyNotify(){
			@Override
			public void notifyResult(Object obj) {
				
				cr = (ChatterResult) obj;
				
				Display.getDefault().asyncExec(new Runnable(){

					@Override
					public void run() {
						text_5.append("来自"+cr.addr+"的消息："+cr.content+"\r\n"+new Date()+"\r\n");
						text_5.append("==============================================\r\n");
						
						hashSet.add(cr.addr);
						table.removeAll();
						for(InetAddress ia:hashSet){
							TableItem ti = new TableItem(table, SWT.NONE);
							ti.setText(ia.getHostAddress());
						}
						
						if(button_2.getSelection()){//如果勾选了自动应答
//							String sendingMessage = UUID.randomUUID().toString();
							String sendingMessage = "先来真人是SB";
							String remoteIP = cr.addr.getHostAddress();
							int remotePort = Integer.parseInt(text_1.getText());
							singleSend(sendingMessage,remoteIP,remotePort);
						}
					}
				});
			}
		}));
		t.setDaemon(true);
		t.start();
		
		Thread t2 = new Thread(new ChatterExitTask(new MyNotify(){
			@Override
			public void notifyResult(Object obj) {
				ChatterResult cr = (ChatterResult)obj;
				InetAddress addr = cr.addr;
				hashSet.remove(addr);
				
				Display.getDefault().asyncExec(new Runnable(){
					@Override
					public void run() {
						table.removeAll();
						for(InetAddress ia:hashSet){
							TableItem ti = new TableItem(table,SWT.NONE);
							ti.setText(ia.getHostAddress());
						}
						
					}
				});
			}
		}));
		t2.setDaemon(true);
		t2.start();
		
		while (!shlZealot.isDisposed()) {
			if (!display.readAndDispatch()) {
				display.sleep();
			}
		}
	}

	/**
	 * Create contents of the window.
	 */
	protected void createContents() {
		shlZealot = new Shell();
		shlZealot.setSize(761, 485);
		shlZealot.setText("ZeaLot聊天室");
		shlZealot.setLayout(new FormLayout());

		Label label = new Label(shlZealot, SWT.NONE);
		FormData fd_label = new FormData();
		fd_label.right = new FormAttachment(0, 311);
		fd_label.top = new FormAttachment(0, 10);
		fd_label.left = new FormAttachment(0, 250);
		label.setLayoutData(fd_label);
		label.setText("对方端口：");

		Label label_2 = new Label(shlZealot, SWT.NONE);
		FormData fd_label_2 = new FormData();
		fd_label_2.right = new FormAttachment(0, 536);
		fd_label_2.top = new FormAttachment(0, 10);
		fd_label_2.left = new FormAttachment(0, 475);
		label_2.setLayoutData(fd_label_2);
		label_2.setText("本地端口：");

		text = new Text(shlZealot, SWT.BORDER);
		FormData fd_text = new FormData();
		fd_text.right = new FormAttachment(0, 244);
		fd_text.top = new FormAttachment(0, 7);
		fd_text.left = new FormAttachment(0, 92);
		text.setLayoutData(fd_text);
		text.setText("192.168.14.100");

		text_1 = new Text(shlZealot, SWT.BORDER);
		FormData fd_text_1 = new FormData();
		fd_text_1.right = new FormAttachment(0, 469);
		fd_text_1.top = new FormAttachment(0, 7);
		fd_text_1.left = new FormAttachment(0, 317);
		text_1.setLayoutData(fd_text_1);
		text_1.setText("10002");

		text_3 = new Text(shlZealot, SWT.BORDER);
		FormData fd_text_3 = new FormData();
		fd_text_3.right = new FormAttachment(0, 694);
		fd_text_3.top = new FormAttachment(0, 7);
		fd_text_3.left = new FormAttachment(0, 542);
		text_3.setLayoutData(fd_text_3);
		text_3.setText("10002");

		text_4 = new Text(shlZealot, SWT.BORDER);
		FormData fd_text_4 = new FormData();
		fd_text_4.right = new FormAttachment(text_3, 0, SWT.RIGHT);
		fd_text_4.left = new FormAttachment(0, 25);
		text_4.setLayoutData(fd_text_4);

		Button button = new Button(shlZealot, SWT.NONE);
		fd_text_4.bottom = new FormAttachment(100, -43);
		FormData fd_button = new FormData();
		fd_button.top = new FormAttachment(text_4, 6);
		fd_button.right = new FormAttachment(label, 0, SWT.RIGHT);
		fd_button.left = new FormAttachment(0, 151);
		button.setLayoutData(fd_button);
		button.setText("发送");

		text_5 = new Text(shlZealot, SWT.BORDER | SWT.READ_ONLY | SWT.WRAP | SWT.H_SCROLL | SWT.V_SCROLL | SWT.CANCEL | SWT.MULTI);
		text_5.setEditable(false);
		FormData fd_text_5 = new FormData();
		fd_text_5.top = new FormAttachment(text, 16);
		fd_text_5.left = new FormAttachment(0, 25);
		text_5.setLayoutData(fd_text_5);

		Composite composite = new Composite(shlZealot, SWT.NONE);
		fd_text_5.bottom = new FormAttachment(composite, 0, SWT.BOTTOM);
		fd_text_5.right = new FormAttachment(composite, -6);
		FormData fd_composite = new FormData();
		fd_composite.bottom = new FormAttachment(text_4, -50);
		fd_composite.top = new FormAttachment(text_3, 16);
		fd_composite.left = new FormAttachment(0, 542);
		fd_composite.right = new FormAttachment(0, 694);
		composite.setLayoutData(fd_composite);
		composite.setLayout(new FillLayout(SWT.HORIZONTAL));

		table = new Table(composite, SWT.BORDER | SWT.FULL_SELECTION);
		table.setHeaderVisible(true);
		table.setLinesVisible(true);

		TableColumn tblclmnip = new TableColumn(table, SWT.NONE);
		tblclmnip.setWidth(148);
		tblclmnip.setText("好友IP");

		Label lblip = new Label(shlZealot, SWT.NONE);
		FormData fd_lblip = new FormData();
		fd_lblip.top = new FormAttachment(label, 0, SWT.TOP);
		fd_lblip.right = new FormAttachment(text, -6);
		fd_lblip.left = new FormAttachment(0, 25);
		lblip.setLayoutData(fd_lblip);
		lblip.setText("对方IP：");
		
		button_1 = new Button(shlZealot, SWT.CHECK);
		fd_text_4.top = new FormAttachment(button_1, 17);
		FormData fd_button_1 = new FormData();
		fd_button_1.bottom = new FormAttachment(100, -157);
		fd_button_1.left = new FormAttachment(text_4, 0, SWT.LEFT);
		button_1.setLayoutData(fd_button_1);
		button_1.setText("群发");
		
		button_2 = new Button(shlZealot, SWT.CHECK);
		button_2.setText("自动应答");
		FormData fd_button_2 = new FormData();
		fd_button_2.bottom = new FormAttachment(button_1, 0, SWT.BOTTOM);
		fd_button_2.left = new FormAttachment(text, 0, SWT.LEFT);
		button_2.setLayoutData(fd_button_2);
		
		button_3 = new Button(shlZealot, SWT.NONE);
		button_3.setText("退出");
		FormData fd_button_3 = new FormData();
		fd_button_3.right = new FormAttachment(0, 559);
		fd_button_3.top = new FormAttachment(0, 409);
		fd_button_3.left = new FormAttachment(0, 414);
		button_3.setLayoutData(fd_button_3);

		
		//选择对方IP
		table.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetDefaultSelected(SelectionEvent e) {
				TableItem[] tis = table.getSelection();
				if(tis==null || tis.length<=0){
					return;
				}
				TableItem ti = tis[0];
				text.setText(ti.getText());
			}
		});
//		回车发送
		text_4.addKeyListener(new KeyAdapter() {
			@Override
			public void keyPressed(KeyEvent e) {
				if(e.keyCode==13){
					String sendingMessage = text_4.getText();
					String remoteIP = text.getText();
					int remotePort = Integer.parseInt(text_1.getText());
					if(button_1.getSelection()){
						allSend(sendingMessage);
					}
					singleSend(sendingMessage,remoteIP,remotePort);
				}
			}
		});
//		发送
		button.addSelectionListener(new SelectionAdapter() {
			@Override
			public void widgetSelected(SelectionEvent e) {
				String sendingMessage = text_4.getText();
				String remoteIP = text.getText();
				int remotePort = Integer.parseInt(text_1.getText());
				System.out.println(remoteIP);
				System.out.println(remotePort);
				if(button_1.getSelection()){
					allSend(sendingMessage);
				}
				singleSend(sendingMessage,remoteIP,remotePort);
			}
		});
		
		//退出时
		shlZealot.addDisposeListener(new DisposeListener() {
			public void widgetDisposed(DisposeEvent arg0) {
				if(MessageDialog.openConfirm(shlZealot, "提示", "是否退出")){
					text_5.append("bye"+"\r\n");
					int remotePort = Integer.parseInt(text_1.getText());
					DatagramSocket ds = null;
					try {
						byte[] bs = "bye".getBytes();
						int len = bs.length;
						InetSocketAddress addr = null;
						DatagramPacket dp = null;
						for(InetAddress ia:hashSet){
							addr = new InetSocketAddress(ia, EXIT_PORT);
							dp = new DatagramPacket(bs, len, addr);
							ds = new DatagramSocket();
							ds.send(dp);
						}
					} catch (Exception e1) {
						e1.printStackTrace();
					} finally{
						if(ds!=null){
							ds.close();
						}
					}
					shlZealot.dispose();
				}
			}
		});
	}
	public void allSend(String sendingMessage){
		text_5.append(sendingMessage+"\r\n");
		int remotePort = Integer.parseInt(text_1.getText());
		int localPort = Integer.parseInt(text_3.getText());
		DatagramSocket ds = null;
		try {
			byte[] bs = sendingMessage.getBytes();
			int len = bs.length;
			InetSocketAddress addr = null;
			DatagramPacket dp = null;
			System.out.println(sendingMessage);
			for(InetAddress ia:hashSet){
				addr = new InetSocketAddress(ia, remotePort);
				dp = new DatagramPacket(bs, len, addr);
				ds = new DatagramSocket();
				ds.send(dp);
			}
		} catch (Exception e1) {
			e1.printStackTrace();
		} finally{
			ds.close();
		}
	}
	
	public void singleSend(String sendingMessage,String remoteIP, int remotePort){
		text_5.append(sendingMessage+"\r\n");
		int localPort = Integer.parseInt(text_3.getText());
		DatagramSocket ds = null;
		try {
			byte[] bs = sendingMessage.getBytes();
			int len = bs.length;
			InetSocketAddress addr = new InetSocketAddress(remoteIP,remotePort);
			DatagramPacket dp = new DatagramPacket(bs, len, addr);
			ds = new DatagramSocket();
			ds.send(dp);
		} catch (Exception e1) {
			e1.printStackTrace();
		} finally{
			ds.close();
		}
	}
}

