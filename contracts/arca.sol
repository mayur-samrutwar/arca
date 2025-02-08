// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ArcaCity is Ownable, ReentrancyGuard {
    IERC20 public arcaToken;
    
    struct Agent {
        string name;
        address owner;
        string gender;
        string occupation;
        uint256 initialBalance;
        string[] traits;
        uint256 birthDate;
        uint256 expiryDate;
        bool isAlive;
        uint256 rewardBalance;
        address publicKey;
        string privateKey;
    }

    struct Organization {
        string name;
        string orgType;
        uint256 totalBalance;
        address[] employees;
        uint256 createdAt;
        string publicKey;
        string privateKey;
    }

    struct City {
        string name;
        uint256 currentPopulation;
        uint256 maxPopulation;
        uint256 treasuryBalance;
        uint256 createdAt;
        bool isInitialized;
    }

    mapping(uint256 => Agent) public agents;
    mapping(uint256 => Organization) public organizations;
    mapping(address => uint256[]) public ownerToAgents;
    
    City public city;
    uint256 public agentCount;
    uint256 public orgCount;
    
    mapping(string => uint256) public occupationCosts;
    
    event AgentCreated(uint256 indexed agentId, address indexed owner, string name);
    event AgentKilled(uint256 indexed agentId);
    event OrganizationCreated(uint256 indexed orgId, string name, string orgType);
    event CityInitialized(string name, uint256 maxPopulation);
    event AgentBirth(uint256 indexed parentAgentId, uint256 indexed newAgentId);
    event RewardClaimed(uint256 indexed agentId, uint256 amount);
    event OccupationCostSet(string occupation, uint256 cost);

    constructor(address _arcaToken) Ownable(msg.sender) {
        arcaToken = IERC20(_arcaToken);
    }

    function createCity(string memory _name, uint256 _maxPopulation) external onlyOwner {
        require(!city.isInitialized, "City already initialized");
        
        city = City({
            name: _name,
            currentPopulation: 0,
            maxPopulation: _maxPopulation,
            treasuryBalance: 0,
            createdAt: block.timestamp,
            isInitialized: true
        });
        
        emit CityInitialized(_name, _maxPopulation);
    }

    function createAgent(
        string memory _name,
        string memory _gender,
        string memory _occupation,
        uint256 _initialBalance,
        string[] memory _traits,
        address _publicKey,
        string memory _privateKey
    ) external nonReentrant returns (uint256) {
        require(_traits.length == 3, "Exactly 3 traits required");
        require(bytes(_name).length > 0, "Name required");
        require(_initialBalance > 0, "Initial balance must be positive");
        require(_publicKey != address(0), "Public key required");
        require(bytes(_privateKey).length > 0, "Private key required");
        
        // Get occupation cost, default to unemployed if invalid
        uint256 occupationCost = occupationCosts[_occupation];
        string memory finalOccupation = _occupation;
        
        if (occupationCost == 0) {
            occupationCost = occupationCosts["unemployed"];
            finalOccupation = "unemployed";
            require(occupationCost > 0, "Unemployed cost not initialized");
        }
        
        // Transfer occupation cost to contract
        require(arcaToken.transferFrom(msg.sender, address(this), occupationCost), "Occupation cost transfer failed");
        
        // Transfer initial balance directly to agent's address
        require(arcaToken.transferFrom(msg.sender, _publicKey, _initialBalance), "Initial balance transfer failed");
        
        uint256 agentId = ++agentCount;
        uint256 expiryDate = block.timestamp + 1 days;

        agents[agentId] = Agent({
            name: _name,
            owner: msg.sender,
            gender: _gender,
            occupation: finalOccupation,
            initialBalance: _initialBalance,
            traits: _traits,
            birthDate: block.timestamp,
            expiryDate: expiryDate,
            isAlive: true,
            rewardBalance: 0,
            publicKey: _publicKey,
            privateKey: _privateKey
        });

        ownerToAgents[msg.sender].push(agentId);
        city.currentPopulation++;
        
        emit AgentCreated(agentId, msg.sender, _name);
        return agentId;
    }

    function killAgent(uint256 _agentId) external {
        require(agents[_agentId].isAlive, "Agent already dead");
        require(msg.sender == agents[_agentId].owner || msg.sender == owner(), "Not authorized");
        
        agents[_agentId].isAlive = false;
        city.currentPopulation--;
        
        emit AgentKilled(_agentId);
    }

    function createOrg(
        string memory _name,
        string memory _orgType,
        string memory _publicKey,
        string memory _privateKey
    ) external onlyOwner returns (uint256) {
        require(bytes(_publicKey).length > 0, "Public key required");
        require(bytes(_privateKey).length > 0, "Private key required");
        
        uint256 orgId = ++orgCount;
        
        organizations[orgId] = Organization({
            name: _name,
            orgType: _orgType,
            totalBalance: 0,
            employees: new address[](0),
            createdAt: block.timestamp,
            publicKey: _publicKey,
            privateKey: _privateKey
        });
        
        emit OrganizationCreated(orgId, _name, _orgType);
        return orgId;
    }

    function birthAgent(
        uint256 _parentAgentId,
        string memory _name,
        string memory _gender,
        string[] memory _traits
    ) external nonReentrant returns (uint256) {
        require(agents[_parentAgentId].isAlive, "Parent agent not alive");
        require(agents[_parentAgentId].owner == msg.sender, "Not parent agent owner");
        require(city.currentPopulation < city.maxPopulation, "City at max population");
        
        uint256 birthTax = 10 ether; // 10 ARCA tokens
        require(arcaToken.transferFrom(msg.sender, address(this), birthTax), "Birth tax payment failed");
        
        uint256 newAgentId = ++agentCount;
        uint256 expiryDate = block.timestamp + 1 days;

        agents[newAgentId] = Agent({
            name: _name,
            owner: msg.sender,
            gender: _gender,
            occupation: "unemployed",
            initialBalance: 100 ether, // Default 100 ARCA
            traits: _traits,
            birthDate: block.timestamp,
            expiryDate: expiryDate,
            isAlive: true,
            rewardBalance: 0,
            publicKey: address(0),
            privateKey: ""
        });

        ownerToAgents[msg.sender].push(newAgentId);
        city.currentPopulation++;
        
        emit AgentBirth(_parentAgentId, newAgentId);
        return newAgentId;
    }

    function claimReward(uint256 _agentId) external nonReentrant {
        require(agents[_agentId].isAlive, "Agent not alive");
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        require(agents[_agentId].rewardBalance > 0, "No rewards to claim");
        
        uint256 amount = agents[_agentId].rewardBalance;
        agents[_agentId].rewardBalance = 0;
        
        require(arcaToken.transfer(msg.sender, amount), "Reward transfer failed");
        
        emit RewardClaimed(_agentId, amount);
    }

    function getAgentInfo(uint256 _agentId) external view returns (
        string memory name,
        address owner,
        string memory gender,
        string memory occupation,
        uint256 initialBalance,
        string[] memory traits,
        uint256 birthDate,
        uint256 expiryDate,
        bool isAlive,
        uint256 rewardBalance,
        address publicKey,
        string memory privateKey
    ) {
        Agent memory agent = agents[_agentId];
        return (
            agent.name,
            agent.owner,
            agent.gender,
            agent.occupation,
            agent.initialBalance,
            agent.traits,
            agent.birthDate,
            agent.expiryDate,
            agent.isAlive,
            agent.rewardBalance,
            agent.publicKey,
            agent.privateKey
        );
    }

    function getAllLiveAgents() external view returns (uint256[] memory) {
        uint256[] memory liveAgents = new uint256[](agentCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= agentCount; i++) {
            if (agents[i].isAlive) {
                liveAgents[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        assembly {
            mstore(liveAgents, count)
        }
        
        return liveAgents;
    }

    function getMyAgents() external view returns (uint256[] memory) {
        return ownerToAgents[msg.sender];
    }

    function getOrgInfo(uint256 _orgId) external view returns (
        string memory name,
        string memory orgType,
        uint256 totalBalance,
        address[] memory employees,
        uint256 createdAt,
        string memory publicKey,
        string memory privateKey
    ) {
        Organization memory org = organizations[_orgId];
        return (
            org.name,
            org.orgType,
            org.totalBalance,
            org.employees,
            org.createdAt,
            org.publicKey,
            org.privateKey
        );
    }

    function setOccupationCost(string memory _occupation, uint256 _cost) external onlyOwner {
        occupationCosts[_occupation] = _cost;
        emit OccupationCostSet(_occupation, _cost);
    }

    function getOccupationCost(string memory _occupation) public view returns (uint256) {
        return occupationCosts[_occupation];
    }

    function fundContract(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be positive");
        require(arcaToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
    }

    function initializeOccupationCosts() external onlyOwner {
        occupationCosts["researcher"] = 500 ether;  // 500 ARCA
        occupationCosts["banker"] = 400 ether;      // 400 ARCA
        occupationCosts["judge"] = 600 ether;       // 600 ARCA
        occupationCosts["council"] = 700 ether;     // 700 ARCA
        occupationCosts["unemployed"] = 100 ether;  // 100 ARCA

        emit OccupationCostSet("researcher", 500 ether);
        emit OccupationCostSet("banker", 400 ether);
        emit OccupationCostSet("judge", 600 ether);
        emit OccupationCostSet("council", 700 ether);
        emit OccupationCostSet("unemployed", 100 ether);
    }

    function getAllOccupationCosts() external view returns (
        string[] memory occupations,
        uint256[] memory costs
    ) {
        string[] memory occList = new string[](5);
        uint256[] memory costList = new uint256[](5);
        
        occList[0] = "researcher";
        occList[1] = "banker";
        occList[2] = "judge";
        occList[3] = "council";
        occList[4] = "unemployed";
        
        for(uint i = 0; i < occList.length; i++) {
            costList[i] = occupationCosts[occList[i]];
        }
        
        return (occList, costList);
    }
}