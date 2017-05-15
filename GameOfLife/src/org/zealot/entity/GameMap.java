package org.zealot.entity;

import java.awt.Color;
import java.awt.Graphics;
import java.util.ArrayDeque;
import java.util.Deque;

/**
 * 生命游戏地图
 * @author ZeaLot
 *
 */
public class GameMap {
	/**
	 * 将两张轮换地图存入队列中
	 * 行列数为20的地图，外围留一圈
	 */
	private Deque<byte[][]> mapQueue = new ArrayDeque<byte[][]>(2);// 8个
	
	/**
	 * 地图行数和列数
	 */
	private int rows, cols;
	/**
	 * 地图格子大小(正方形)
	 */
	private int gridSize;
	
	/**
	 * 当前活细胞数量
	 */
	private int aliveCellCount = 0;
	
	/**
	 * 指定行数, 列数和格子大小的构造方法
	 * @param rowNum
	 * @param colNum
	 * @param gridSize
	 */
	public GameMap(int rowNum, int colNum, int gridSize){
		this.rows = rowNum + 2;
		this.cols = colNum + 2;
		mapQueue.offer(new byte[this.rows][this.cols]);
		mapQueue.offer(new byte[this.rows][this.cols]);
		this.gridSize = gridSize;
		
//		byte[][] gameMap = mapQueue.peek();
//		gameMap[8][20] = 1;
//		gameMap[8][19] = 1;
//		gameMap[8][21] = 1;
//		gameMap[7][20] = 1;
//		gameMap[6][20] = 1;
//		gameMap[5][20] = 1;
//		
//		gameMap[8][36] = 1;
//		gameMap[8][35] = 1;
//		gameMap[8][37] = 1;
//		gameMap[7][36] = 1;
//		gameMap[6][36] = 1;
//		gameMap[5][36] = 1;
	}
	
	/**
	 * 取得格子大小
	 * @return
	 */
	public int getGridSize() {
		return this.gridSize;
	}
	
	/**
	 * 取得当前活细胞数
	 * @return
	 */
	public int getAliveCellCount(){
		return this.aliveCellCount;
	}
	/**
	 * 取得当前死细胞数
	 * @return
	 */
	public int getDeadCellCount(){
		return (this.rows-2) * (this.cols-2) - this.aliveCellCount;
	}
	
	/**
	 * 画地图
	 */
	public void drawGameMap(Graphics g) {
		g.setColor(Color.GRAY);
		byte[][] gameMap = mapQueue.peek();
		int r = this.rows - 2,
			c = this.cols - 2;
		int i, j;
		for(i=0; i<=r; i++)    //要多画一根行线
			g.drawLine(0, i*gridSize, c*gridSize, i*gridSize);
		for(j=0; j<=c; j++)    //要多画一根列线
			g.drawLine(j*gridSize, 0, j*gridSize, r*gridSize);
		
		for(i=1; i<=r; i++)
			for(j=1; j<=c; j++)
				if(gameMap[i][j] == 1){
					g.setColor(Color.GREEN);
					g.fillRect((j-1)*gridSize, (i-1)*gridSize, gridSize, gridSize);
					g.setColor(Color.GRAY);
					g.drawRect((j-1)*gridSize, (i-1)*gridSize, gridSize, gridSize);
				}
	}
	
	public void changeMap(){
		byte[][] gameMap = mapQueue.poll();
		byte[][] gameMap0 = mapQueue.peek();
		mapQueue.offer(gameMap);
		for(int i=1; i<rows-1; i++)
			for(int j=1; j<cols-1; j++)
				changeCellState(gameMap, gameMap0, i, j);
	}
	/**
	 * 改变当前细胞状态（死亡 or 复活）
	 * @param gameMap
	 * @param gameMap0
	 * @param rowPos
	 * @param colPos
	 */
	private void changeCellState(byte[][] gameMap, byte[][] gameMap0, int rowPos, int colPos) {
		int neighborCount = gameMap[rowPos - 1][colPos - 1] + gameMap[rowPos - 1][colPos]
				          + gameMap[rowPos - 1][colPos + 1] + gameMap[rowPos][colPos + 1] 
				          + gameMap[rowPos + 1][colPos + 1] + gameMap[rowPos + 1][colPos] 
				          + gameMap[rowPos + 1][colPos - 1] + gameMap[rowPos][colPos - 1];
		if (neighborCount < 2 || neighborCount > 3){ // 周围细胞小于2或者大于3则变为死亡状态
			if(gameMap[rowPos][colPos] == 1)
				this.aliveCellCount--;
			gameMap0[rowPos][colPos] = 0;
		}else if (neighborCount == 3){ // 周围细胞为3则当前细胞复活
			if(gameMap[rowPos][colPos] == 0)
				this.aliveCellCount++;
			gameMap0[rowPos][colPos] = 1;
		}else    // 周围细胞为2则当前细胞状态不变
			gameMap0[rowPos][colPos] = gameMap[rowPos][colPos];
	}

	/**
	 * 仅仅是简单改变细胞状态，活的变死的，死的变活的，最后要改变活细胞数量
	 * @param rowPos
	 * @param colPos
	 */
	public void changeCellState(int rowPos, int colPos){
		byte[][] gameMap = this.mapQueue.peek();
		if(gameMap[rowPos][colPos] == 1){
			this.aliveCellCount--;
			gameMap[rowPos][colPos] = 0;
		}else{
			this.aliveCellCount++;
			gameMap[rowPos][colPos] = 1;
		}
	}
	
	/**
	 * 计算
	 * @return
	 */
//	public int aliveCellNum(){
//		byte[][] gameMap = mapQueue.peek();
//		return Arrays.sum(gameMap);
//	}
}
