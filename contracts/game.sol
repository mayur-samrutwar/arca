// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ArcaArcade is Ownable, ReentrancyGuard {
    IERC20 public arcaToken;
    address public arcaCityContract;
    
    struct Game {
        string name;
        uint256 entryFee;
        bool isActive;
    }
    
    mapping(string => Game) public games;
    mapping(address => mapping(string => uint256)) public playerLastGameTime;
    
    event GameAdded(string name, uint256 entryFee);
    event GamePlayed(address indexed player, string game, uint256 fee);
    event GameFeeUpdated(string game, uint256 newFee);
    
    constructor(address _arcaToken, address _arcaCityContract) Ownable(msg.sender) {
        arcaToken = IERC20(_arcaToken);
        arcaCityContract = _arcaCityContract;
        
        // Initialize default games
        addGame("snake", 100 ether); // 100 ARCA tokens
    }
    
    function addGame(string memory _name, uint256 _entryFee) public onlyOwner {
        games[_name] = Game({
            name: _name,
            entryFee: _entryFee,
            isActive: true
        });
        
        emit GameAdded(_name, _entryFee);
    }
    
    function updateGameFee(string memory _game, uint256 _newFee) external onlyOwner {
        require(games[_game].isActive, "Game does not exist");
        games[_game].entryFee = _newFee;
        emit GameFeeUpdated(_game, _newFee);
    }
    
    function playGame(string memory _game) external nonReentrant returns (bool) {
        Game memory game = games[_game];
        require(game.isActive, "Game not available");
        require(
            block.timestamp >= playerLastGameTime[msg.sender][_game] + 10 seconds,
            "Please wait before playing again"
        );
        
        // Transfer entry fee
        require(
            arcaToken.transferFrom(msg.sender, arcaCityContract, game.entryFee),
            "Fee transfer failed"
        );
        
        // Update last play time
        playerLastGameTime[msg.sender][_game] = block.timestamp;
        
        emit GamePlayed(msg.sender, _game, game.entryFee);
        return true;
    }
    
    function getGameFee(string memory _game) external view returns (uint256) {
        require(games[_game].isActive, "Game not available");
        return games[_game].entryFee;
    }
    
    function canPlayerPlay(address _player, string memory _game) external view returns (bool) {
        return block.timestamp >= playerLastGameTime[_player][_game] + 10 seconds;
    }
}