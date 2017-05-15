package org.zealot.ui;
import java.awt.Color;
import java.awt.Cursor;
import java.awt.EventQueue;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import javax.swing.JFrame;
import javax.swing.SwingUtilities;
import javax.swing.border.BevelBorder;
import javax.swing.border.SoftBevelBorder;
import javax.swing.ButtonGroup;
import javax.swing.JButton;
import java.awt.Font;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;
import javax.swing.event.ChangeListener;
import javax.swing.event.ChangeEvent;
import javax.swing.JSlider;
import javax.swing.JLabel;
import javax.swing.JRadioButton;
import java.awt.event.ItemListener;
import java.awt.event.ItemEvent;
import javax.swing.JTextField;

public class GameMainWindow {
	private JFrame frame;
	
	/**
	 * 线程池
	 */
	private ExecutorService exec = Executors.newCachedThreadPool();
	
	/**
	 * 游戏地图画板
	 */
	private GameMapPanel panel = null;
	
	private Future<?> f1 = null;
	private JTextField textField;
	private JTextField textField_1;
	private JTextField textField_2;
	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					GameMainWindow window = new GameMainWindow();
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
	public GameMainWindow() {
		initialize();
	}

	/**
	 * Initialize the contents of the frame.
	 */
	private void initialize() {
		frame = new JFrame();
		frame.setResizable(false);
		frame.setTitle("生命游戏:天启");
		frame.setBounds(0, 0, 1366, 730);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		frame.getContentPane().setLayout(null);
		
		panel = new GameMapPanel();
		panel.setBorder(new SoftBevelBorder(BevelBorder.LOWERED, null, null, null, null));
		panel.setBackground(Color.DARK_GRAY);
		panel.setBounds(0, 0, 1360, 602);
		frame.getContentPane().add(panel);
		
		final JButton button = new JButton("自动繁殖");
		button.setEnabled(false);
		button.setFont(new Font("宋体", Font.PLAIN, 13));
		button.setBounds(242, 664, 106, 30);
		frame.getContentPane().add(button);
		
		final JButton button_1 = new JButton("繁殖下一代");
		button_1.setEnabled(false);
		button_1.setFont(new Font("宋体", Font.PLAIN, 13));
		button_1.setBounds(126, 664, 106, 30);
		frame.getContentPane().add(button_1);
		
		final JButton button_2 = new JButton("毁灭世界");
		button_2.setFont(new Font("宋体", Font.PLAIN, 13));
		button_2.setBounds(10, 664, 106, 30);
		frame.getContentPane().add(button_2);
		
		final JSlider slider = new JSlider();
		slider.setEnabled(false);
		slider.setSnapToTicks(true);
		slider.setPaintTicks(true);
		slider.setMaximum(panel.getMaxSpeed());
		slider.setValue(panel.getSpeed());
		slider.setMinorTickSpacing(panel.getSpeedStep());
		slider.setMajorTickSpacing(panel.getSpeedStep());
		slider.setBounds(254, 617, 138, 45);
		frame.getContentPane().add(slider);
		
		JLabel label = new JLabel("繁殖速度:");
		label.setFont(new Font("宋体", Font.PLAIN, 13));
		label.setBounds(191, 617, 59, 37);
		frame.getContentPane().add(label);
		
		JLabel label_1 = new JLabel("繁殖代数:");
		label_1.setFont(new Font("宋体", Font.PLAIN, 12));
		label_1.setBounds(402, 611, 58, 21);
		frame.getContentPane().add(label_1);
		
		JLabel label_2 = new JLabel("活细胞数:");
		label_2.setFont(new Font("宋体", Font.PLAIN, 12));
		label_2.setBounds(402, 642, 58, 21);
		frame.getContentPane().add(label_2);
		
		JLabel label_3 = new JLabel("死细胞数:");
		label_3.setFont(new Font("宋体", Font.PLAIN, 12));
		label_3.setBounds(402, 673, 58, 21);
		frame.getContentPane().add(label_3);
		
		JRadioButton radioButton = new JRadioButton("上帝模式");
		radioButton.setToolTipText("此模式下可以通过点击世界地图设置细胞生死.");
		radioButton.setFont(new Font("宋体", Font.PLAIN, 13));
		radioButton.setSelected(true);
		radioButton.setBounds(10, 624, 78, 23);
		frame.getContentPane().add(radioButton);
		
		JRadioButton radioButton_1 = new JRadioButton("观察者模式");
		radioButton_1.setToolTipText("此模式下可以繁殖细胞并调整参数.");
		radioButton_1.setFont(new Font("宋体", Font.PLAIN, 13));
		radioButton_1.setBounds(86, 624, 91, 23);
		frame.getContentPane().add(radioButton_1);
		
		ButtonGroup group = new ButtonGroup();		
		group.add(radioButton);
		group.add(radioButton_1);
		
		textField = new JTextField("1");	//初始为1代
		textField.setEditable(false);
		textField.setBounds(462, 611, 46, 21);
		frame.getContentPane().add(textField);
		textField.setColumns(10);
		
		textField_1 = new JTextField("0");	//初始化为0个活细胞
		textField_1.setEditable(false);
		textField_1.setColumns(10);
		textField_1.setBounds(462, 642, 46, 21);
		frame.getContentPane().add(textField_1);
		
		textField_2 = new JTextField("8160");		//初始化为地图大小个死细胞
		textField_2.setEditable(false);
		textField_2.setColumns(10);
		textField_2.setBounds(462, 673, 46, 21);
		frame.getContentPane().add(textField_2);
		
		//将3个textFiled丢给panel处理
		panel.setGenerationTextField(textField);
		panel.setAliveCellCountTextField(textField_1);
		panel.setDeadCellCountTextField(textField_2);
		
		/**
		 * 上帝模式:	可以点击设置细胞生死，毁灭世界，但不能繁殖
		 * 观察者模式:	不可能点击设置细胞生死，毁灭世界，但能够繁殖
		 */
		radioButton.addItemListener(new ItemListener() {
			public void itemStateChanged(ItemEvent e) {
				if(e.getStateChange() == 1){	//选中的是上帝模式
					panel.setGameModel(GameMapPanel.GameModel.GOD);
					slider.setEnabled(false);
					button.setEnabled(false);
					button_1.setEnabled(false);
					button_2.setEnabled(true);
				}else{		//选中的是观察者模式 
					panel.setGameModel(GameMapPanel.GameModel.OBSERVER);
					slider.setEnabled(true);
					button.setEnabled(true);
					button_1.setEnabled(true);
					button_2.setEnabled(false);
				}
			}
		});
		
		/**
		 * 毁灭世界所有细胞
		 */
		button_2.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				if(f1 != null){	//如果有线程正在运行，要先结束
					f1.cancel(true);
					f1 = null;
				}
				button.setText("自动繁殖");
				panel.newGameMap();
				panel.repaint();
				panel.setGeneration(1);
				textField.setText("1");		//变为初代
				textField_1.setText("0");	//0个活细胞
				textField_2.setText("8160");//地图大小个死细胞
			}
		});
		
		
		
		/**
		 * 点击繁殖下一代
		 */
		button_1.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				if(f1 == null){	//如果future不为null说明正在自动繁殖，此时不可手动繁殖
					panel.repaint();
					panel.getGameMap().changeMap();
					
					textField.setText(String.valueOf(panel.nextGeneration()));		//下一代
					textField_1.setText(String.valueOf(panel.getAliveCellCount()));	
					textField_2.setText(String.valueOf(panel.getDeadCellCount()));
				}
			}
		});
		
		/**
		 * 点击启动自动繁殖
		 */
		button.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				if("自动繁殖".equals(button.getText())){	//启动繁殖
					button.setText("停止繁殖");
					startReproduce();
				}else{
					button.setText("自动繁殖");	//停止繁殖
					stopReproduce();
				}
			}
		});
		
		/**
		 * 改变繁殖速度
		 */
		slider.addChangeListener(new ChangeListener() {
			public void stateChanged(ChangeEvent e) {
				panel.setSpeed(slider.getValue());
			}
		});
		
		/**
		 * 以下监听在鼠标进入区域后改变形状，变成手形
		 */
		button_2.addMouseListener(new MouseAdapter() {
			@Override
			public void mouseEntered(MouseEvent e) {
				button_2.setCursor(new Cursor(Cursor.HAND_CURSOR));
			}
		});
		button_1.addMouseListener(new MouseAdapter() {
			@Override
			public void mouseEntered(MouseEvent e) {
				button_1.setCursor(new Cursor(Cursor.HAND_CURSOR));
			}
		});
		button.addMouseListener(new MouseAdapter() {
			@Override
			public void mouseEntered(MouseEvent e) {
				button.setCursor(new Cursor(Cursor.HAND_CURSOR));
			}
		});
		slider.addMouseListener(new MouseAdapter() {
			@Override
			public void mouseEntered(MouseEvent e) {
				slider.setCursor(new Cursor(Cursor.HAND_CURSOR));
			}
		});
		panel.addMouseListener(new MouseAdapter() {
			@Override
			public void mouseEntered(MouseEvent e) {
				if(panel.getGameModel() == GameMapPanel.GameModel.GOD)	//上帝模式才变成手形，表示可以设置细胞生死
					panel.setCursor(new Cursor(Cursor.HAND_CURSOR));
				else
					panel.setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
			}
			/**
			 * 鼠标点击世界地图设置细胞生死
			 */
			@Override
			public void mouseClicked(MouseEvent e) {
				if(panel.getGameModel() == GameMapPanel.GameModel.GOD){ //上帝模式才能设置细胞生死
					button.setText("自动繁殖");
					if(f1 != null)	//如果正在自动繁殖，最好是将其中断
						stopReproduce();
					int c = e.getX() / panel.getGridSize() + 1,
						r = e.getY() / panel.getGridSize() + 1;
					panel.changeCellState(r, c);
					panel.repaint();
					textField_1.setText(String.valueOf(panel.getAliveCellCount()));
					textField_2.setText(String.valueOf(panel.getDeadCellCount()));
				}
			}
		});
	}
	
	/**
	 * 自动繁殖下一代
	 */
	private void startReproduce(){
		f1 = exec.submit(panel);
	}
	
	/**
	 * 中断自动繁殖
	 */
	private void stopReproduce(){
		f1.cancel(true);
		f1 = null;	//线程中断了则future变为null
	}
	
}
