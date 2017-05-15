package org.zealot.ui;

import java.awt.Graphics;

import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;

import org.zealot.entity.GameMap;
/**
 * 游戏地图画板
 * @author ZeaLot
 *
 */
@SuppressWarnings("serial")
public class GameMapPanel extends JPanel implements Runnable {
	private GameMap gm;
	
	public GameMap getGameMap() {
		return this.gm;
	}
	
	private JTextField generationTextField = null;
	private JTextField aliveCellCountTextField = null;
	private JTextField deadCellCountTextField = null;
	
	public void setGenerationTextField(JTextField generationTextField) {
		this.generationTextField = generationTextField;
	}
	public void setAliveCellCountTextField(JTextField aliveCellCountTextField) {
		this.aliveCellCountTextField = aliveCellCountTextField;
	}
	public void setDeadCellCountTextField(JTextField deadCellCountTextField) {
		this.deadCellCountTextField = deadCellCountTextField;
	}
	/**
	 * 游戏模式
	 * 上帝模式
	 * 观察者模式
	 * @author ZeaLot
	 *
	 */
	public enum GameModel {
		GOD, OBSERVER
	}
	
	private GameModel gameModel;
	
	public GameModel getGameModel(){
		return this.gameModel;
	}
	public void setGameModel(GameModel gameModel){
		this.gameModel = gameModel; 
	}
	
	/**
	 * 获取繁殖的代
	 */
	private int generationCount = 1;
	
	public int getGeneration(){
		return generationCount;
	}
	/**
	 * 设置繁殖的代
	 */
	public void setGeneration(int generation){
		this.generationCount = generation;
	}
	/**
	 * 下一代
	 */
	public int nextGeneration(){
		return ++this.generationCount;
	}
	
	public int getAliveCellCount(){
		return this.gm.getAliveCellCount();
	}
	public int getDeadCellCount(){
		return this.gm.getDeadCellCount();
	}
	

	
	/**
	 * 繁殖速度 50 150 250 250 350 ... 950
	 */
	private static final int MAX_SPEED = 950;
	private static final int MIN_SPEED = 50;
	private static final int SPEED_STEP = 100;
	private int speed = MIN_SPEED;
	/**
	 * 繁殖间隔 950 850 750 650 ... 50
	 */
	private int interval = 1000 - speed;
	
	public int getInterval(){
		return this.interval;
	}
	/**
	 * 取得当前速度
	 * @return
	 */
	public int getSpeed(){
		return this.speed;
	}
	
	/**
	 * 取得最大速度 
	 * @return
	 */
	public int getMaxSpeed(){
		return MAX_SPEED;
	}
	
	/**
	 * 取得最小速度
	 * @return
	 */
	public int getMinSpeed(){
		return MIN_SPEED;
	}
	
	/**
	 * 取得速度增长步长 
	 * @return
	 */
	public int getSpeedStep(){
		return SPEED_STEP;
	}
	
	/**
	 * 设置速度(同时设置时间间隔)
	 * @param speed
	 */
	public void setSpeed(int speed){
		this.speed = speed;
		this.interval = 1000 - this.speed;
	}
	
	/**
	 * 取得格子大小
	 * @return
	 */
	public int getGridSize(){
		return this.gm.getGridSize();
	}
	
	
	/**
	 * Create the panel.
	 */
	public GameMapPanel() {
		this.gm = new GameMap(60, 136, 10);
		this.gameModel = GameModel.GOD;
	}

	/**
	 * 创建新的游戏地图
	 */
	public void newGameMap(){
		this.gm = new GameMap(60, 136, 10);
	}
	
	/**
	 * 注意paint方法中不要有和绘图无关的逻辑代码(数据变化莫名其妙)，paint方法中应该只放绘图代码
	 */
	@Override
	public void paint(Graphics g) {
		super.paint(g);
		gm.drawGameMap(g);
	}

	@Override
	public void run() {
		try{
			while(!Thread.interrupted()){
				Thread.sleep(interval);
				SwingUtilities.invokeLater(new Runnable(){
					@Override
					public void run() {
						repaint();
						gm.changeMap();		
						nextGeneration();
						/*
						 * 把细胞数据显示到右边监测域中
						 */
						generationTextField.setText(String.valueOf(generationCount));
						aliveCellCountTextField.setText(String.valueOf(gm.getAliveCellCount()));
						deadCellCountTextField.setText(String.valueOf(gm.getDeadCellCount()));
					}
				});
			}
		}catch(InterruptedException e) {
			throw new RuntimeException("自动繁殖中断");
		}
	}
	
	/**
	 * 仅仅是简单改变细胞状态，活的变死的，死的变活的
	 * @param r
	 * @param c
	 */
	public void changeCellState(int r, int c) {
		this.gm.changeCellState(r, c);
	}
	

}
