package com.zealot.ui;

import java.awt.Color;
import java.awt.EventQueue;
import java.awt.Graphics;
import java.awt.SystemColor;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;

import javax.swing.JFrame;
import javax.swing.JOptionPane;
import javax.swing.JPanel;

import com.zealot.bean.Fruits;
import com.zealot.bean.Snake;
import com.zealot.bean.Snake.Direction;
import javax.swing.JMenuBar;
import javax.swing.JMenu;
import javax.swing.JMenuItem;
import java.awt.Font;
import javax.swing.JLabel;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.concurrent.SynchronousQueue;
import javax.swing.event.MenuKeyListener;
import javax.swing.event.MenuKeyEvent;

public class MainWindow {

	private JFrame frame;
	private GameMap gameMap;
	private Thread snakeThread;
	
	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					MainWindow window = new MainWindow();
					window.frame.setVisible(true);
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		});
	}

	/**
	 * Create the application.
	 */
	public MainWindow() {
		initialize();
	}

	/**
	 * Initialize the contents of the frame.
	 */
	private void initialize() {
		frame = new JFrame();
		frame.setTitle("贪食蛇");
		frame.setResizable(false);
		frame.setBounds(300, 160, 507, 552);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

		gameMap = new GameMap();
		gameMap.setBounds(0, 0, 504, 504);
		frame.getContentPane().add(gameMap);
		gameMap.setLayout(null);
		
		JMenuBar menuBar = new JMenuBar();
		frame.setJMenuBar(menuBar);
		
		JMenu menu = new JMenu("文件");
		menu.setFont(new Font("新宋体", Font.PLAIN, 12));
		menuBar.add(menu);
		
		JMenuItem menuItem = new JMenuItem("重新开始");
		menuItem.setFont(new Font("新宋体", Font.PLAIN, 12));
		menu.add(menuItem);
		launchSnake();
		
		menuItem.addMouseListener(new MouseAdapter() {
			@Override
			public void mousePressed(MouseEvent e) {
				replay();
			}
		});
		
		frame.addKeyListener(new KeyAdapter() {
			@Override
			public void keyPressed(KeyEvent e) {
				switch (e.getKeyCode()) {
				case KeyEvent.VK_UP:
					// 不能朝相反方向爬行
					if (gameMap.snake.getDirection() != Direction.DOWN)
						gameMap.snake.setDirection(Direction.UP);
					break;
				case KeyEvent.VK_DOWN:
					if (gameMap.snake.getDirection() != Direction.UP)
						gameMap.snake.setDirection(Direction.DOWN);
					break;
				case KeyEvent.VK_LEFT:
					if (gameMap.snake.getDirection() != Direction.RIGHT)
						gameMap.snake.setDirection(Direction.LEFT);
					break;
				case KeyEvent.VK_RIGHT:
					if (gameMap.snake.getDirection() != Direction.LEFT)
						gameMap.snake.setDirection(Direction.RIGHT);
					break;
				case KeyEvent.VK_ADD:
					gameMap.speedUp();
					break;
				case KeyEvent.VK_SUBTRACT:
					gameMap.slowDown();
					break;
				case KeyEvent.VK_SPACE:
					pauseSnake();
					break;
				case KeyEvent.VK_ENTER:
					replay();
					launchSnake();
					break;
				default:
					break;
				}
			}
		});
	}
	private void replay(){
		gameMap.running = true;
		gameMap.interval = 450;
		gameMap.speedRank = 1;
		gameMap.cnt = 0;
		GameMap.isPossessed = new int[GameMap.rows+1][GameMap.cols+1];
		GameMap.snake = new Snake();
		GameMap.snake.setMovingBoundary(GameMap.rows, 1, GameMap.cols, 1);
		GameMap.fruits = new Fruits();
	}
	private void launchSnake() {
		snakeThread = new Thread(gameMap);
		if (!snakeThread.isAlive()) {
			snakeThread.start();
		}
	}

	private void pauseSnake() {
		if(gameMap.pause == false)
			gameMap.setPause(true);
		else
			gameMap.setPause(false);
	}

	public static class GameMap extends JPanel implements Runnable {
		static int rows = 50;// 行数
		static int cols = 50;// 列数
		int gridSize = 10;// 格子宽度
		boolean pause = false;// 是否中途暂停游戏 
		boolean running = true;// 是否运行游戏 
		long interval = 450;// 爬行间隔
		int speedRank = 1;//速度等级1-9
		int cnt = 0;//果实出现的计数器，每数到10出现一个
		public static int[][] isPossessed = new int[rows+1][cols+1];//动态保存被身体占据的格子标识，1表示蛇身，2表示果实 
		public static Snake snake = new Snake();
		public static Fruits fruits = new Fruits();
		
		public GameMap() {
			setForeground(SystemColor.inactiveCaptionBorder);
			setBackground(Color.DARK_GRAY);
			snake.setMovingBoundary(rows, 1, cols, 1);
		}

		@Override
		public void paint(Graphics g) {
			super.paint(g);
			g.setColor(Color.GRAY);
			// 画横线
			for (int i = 0; i <= rows; i++) {
				g.drawLine(this.getX(), this.getY() + i * gridSize, this.getX() + gridSize * cols,
						this.getY() + i * gridSize);
			}
			// 画竖线
			for (int i = 0; i <= cols; i++) {
				g.drawLine(this.getX() + i * gridSize, this.getY(), this.getX() + i * gridSize,
						this.getY() + gridSize * rows);
			}
			//每20步产生一颗果实
			if(this.cnt++ >= 20){
				fruits.addOne();
				this.cnt = 0;
			}
			fruits.drawFruit(g, this.getX(), this.getY(), gridSize);
			snake.drawSnake(g, this.getX(), this.getY(), gridSize);
			g.setColor(Color.YELLOW);
			g.setFont(new Font("新宋体", Font.BOLD, 15));
			g.drawString("当前得分："+snake.getCurrScore(), 10, 20);
			g.drawString("当前长度："+snake.getSnakeHead().size(), 10, 40);
			g.drawString("当前速度："+speedRank, 10, 60);
			if(this.running == false){
				g.setColor(Color.ORANGE);
				g.setFont(new Font("新宋体",Font.ITALIC, 50));
				g.drawString("GAME OVER", 130, 230);
			}
		}

		//取消暂停继续游戏
		public void setPause(boolean pause){
			if(pause == false)
				synchronized (this) {
					this.notifyAll();
				}
			this.pause = pause;
		}
		
		@Override
		public void run() {
			while (running) {
				if(pause == true){//暂停游戏
					synchronized (this) {
						try {
							this.wait();
						} catch (InterruptedException e) {
							e.printStackTrace();
						}
					}
				}
				try {
					Thread.sleep(interval);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				// 判断是否碰到边界
				if (!snake.move()) {
					//JOptionPane.showMessageDialog(this, "游戏结束", "提示", JOptionPane.INFORMATION_MESSAGE);
					
					running = false;
				} else
					repaint();
			}
			repaint();//游戏结束后画一次“游戏结束”
		}
		// 改变蛇的移动速度（等待间隔）
		public void speedUp() {
			if (interval >= 100){
				interval -= 50;
				speedRank++;
			}
		}

		public void slowDown() {
			if (interval <= 450){
				interval += 50;
				speedRank--;
			}
		}
	}
}
