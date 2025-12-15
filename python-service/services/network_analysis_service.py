"""
Network Analysis Service using NetworkX
Implements hashtag networks, mention networks, community detection, and influence analysis
"""
import networkx as nx
from typing import Dict, List, Any
from collections import Counter
import pandas as pd

class NetworkAnalysisService:
    def __init__(self):
        """Initialize network analysis service"""
        pass
    
    def build_hashtag_network(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Build hashtag co-occurrence network from posts
        Args:
            posts: List of post objects with 'hashtags' or 'content' field
        Returns:
            {
                'nodes': [{'id': str, 'label': str, 'weight': int}],
                'edges': [{'source': str, 'target': str, 'weight': int}],
                'stats': {}
            }
        """
        G = nx.Graph()
        
        # Extract hashtags from posts
        post_hashtags = []
        for post in posts:
            hashtags = []
            if 'hashtags' in post and post['hashtags']:
                hashtags = post['hashtags'] if isinstance(post['hashtags'], list) else []
            elif 'content' in post:
                # Extract hashtags from content
                import re
                hashtags = re.findall(r'#(\w+)', post['content'])
            
            # Normalize hashtags
            hashtags = [tag.lower().strip('#') for tag in hashtags if tag]
            if len(hashtags) > 1:
                post_hashtags.append(hashtags)
        
        # Count hashtag occurrences (node weights)
        hashtag_counts = Counter()
        for hashtags in post_hashtags:
            hashtag_counts.update(hashtags)
        
        # Add nodes with weights
        for hashtag, count in hashtag_counts.items():
            G.add_node(hashtag, weight=count)
        
        # Add edges for co-occurring hashtags (edge weights)
        for hashtags in post_hashtags:
            for i, tag1 in enumerate(hashtags):
                for tag2 in hashtags[i+1:]:
                    if G.has_edge(tag1, tag2):
                        G[tag1][tag2]['weight'] += 1
                    else:
                        G.add_edge(tag1, tag2, weight=1)
        
        # Convert to JSON format
        nodes = [{
            'id': node,
            'label': f"#{node}",
            'weight': G.nodes[node].get('weight', 1),
            'degree': G.degree(node)
        } for node in G.nodes()]
        
        edges = [{
            'source': edge[0],
            'target': edge[1],
            'weight': G.edges[edge].get('weight', 1)
        } for edge in G.edges()]
        
        # Calculate network statistics
        stats = {
            'total_nodes': G.number_of_nodes(),
            'total_edges': G.number_of_edges(),
            'density': nx.density(G) if G.number_of_nodes() > 1 else 0,
            'average_clustering': nx.average_clustering(G) if G.number_of_nodes() > 2 else 0,
            'is_connected': nx.is_connected(G) if G.number_of_nodes() > 0 else False
        }
        
        return {
            'nodes': nodes,
            'edges': edges,
            'stats': stats,
            'graph_type': 'hashtag_cooccurrence'
        }
    
    def build_mention_network(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Build mention/interaction network from posts
        Args:
            posts: List of post objects with 'mentions' or 'content' field
        Returns:
            Network structure with nodes and edges
        """
        G = nx.DiGraph()  # Directed graph for mentions
        
        # Extract mentions from posts
        for post in posts:
            mentions = []
            author = post.get('author_username', post.get('username', 'unknown'))
            
            if 'mentions' in post and post['mentions']:
                mentions = post['mentions'] if isinstance(post['mentions'], list) else []
            elif 'content' in post:
                # Extract mentions from content
                import re
                mentions = re.findall(r'@(\w+)', post['content'])
            
            # Normalize mentions
            mentions = [mention.lower().strip('@') for mention in mentions if mention]
            
            # Add author as node
            if not G.has_node(author):
                G.add_node(author, type='user', posts=0)
            G.nodes[author]['posts'] = G.nodes[author].get('posts', 0) + 1
            
            # Add mentions as edges (author mentions user)
            for mention in mentions:
                if not G.has_node(mention):
                    G.add_node(mention, type='user', posts=0)
                
                if G.has_edge(author, mention):
                    G[author][mention]['weight'] += 1
                else:
                    G.add_edge(author, mention, weight=1)
        
        # Convert to JSON format
        nodes = [{
            'id': node,
            'label': node,
            'type': G.nodes[node].get('type', 'user'),
            'posts': G.nodes[node].get('posts', 0),
            'in_degree': G.in_degree(node),
            'out_degree': G.out_degree(node)
        } for node in G.nodes()]
        
        edges = [{
            'source': edge[0],
            'target': edge[1],
            'weight': G.edges[edge].get('weight', 1)
        } for edge in G.edges()]
        
        # Calculate network statistics
        stats = {
            'total_nodes': G.number_of_nodes(),
            'total_edges': G.number_of_edges(),
            'density': nx.density(G) if G.number_of_nodes() > 1 else 0,
            'is_strongly_connected': nx.is_strongly_connected(G) if G.number_of_nodes() > 0 else False,
            'is_weakly_connected': nx.is_weakly_connected(G) if G.number_of_nodes() > 0 else False
        }
        
        return {
            'nodes': nodes,
            'edges': edges,
            'stats': stats,
            'graph_type': 'mention_network'
        }
    
    def detect_communities(self, network_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect communities in a network using Louvain algorithm
        Args:
            network_data: Network structure with nodes and edges
        Returns:
            Communities and their members
        """
        # Rebuild graph from network data
        G = nx.Graph()
        
        # Add nodes
        for node in network_data.get('nodes', []):
            node_id = node.get('id') or node.get('label')
            G.add_node(node_id, **{k: v for k, v in node.items() if k not in ['id', 'label']})
        
        # Add edges
        for edge in network_data.get('edges', []):
            source = edge.get('source')
            target = edge.get('target')
            weight = edge.get('weight', 1)
            if source and target:
                G.add_edge(source, target, weight=weight)
        
        if G.number_of_nodes() == 0:
            return {
                'communities': [],
                'num_communities': 0,
                'modularity': 0
            }
        
        # Detect communities using greedy modularity communities
        try:
            communities = nx.community.greedy_modularity_communities(G, weight='weight')
            modularity = nx.community.modularity(G, communities, weight='weight')
            
            community_list = []
            for i, community in enumerate(communities):
                community_list.append({
                    'id': i,
                    'members': list(community),
                    'size': len(community)
                })
            
            return {
                'communities': community_list,
                'num_communities': len(communities),
                'modularity': float(modularity)
            }
        except Exception as e:
            # Fallback to simple connected components
            communities = list(nx.connected_components(G))
            community_list = []
            for i, community in enumerate(communities):
                community_list.append({
                    'id': i,
                    'members': list(community),
                    'size': len(community)
                })
            
            return {
                'communities': community_list,
                'num_communities': len(communities),
                'modularity': 0.0,
                'method': 'connected_components'
            }
    
    def analyze_influence(self, network_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze influence in network using centrality measures
        Args:
            network_data: Network structure with nodes and edges
        Returns:
            Influence scores for each node
        """
        # Determine if directed or undirected
        is_directed = network_data.get('graph_type') == 'mention_network'
        
        if is_directed:
            G = nx.DiGraph()
        else:
            G = nx.Graph()
        
        # Add nodes
        for node in network_data.get('nodes', []):
            node_id = node.get('id') or node.get('label')
            G.add_node(node_id)
        
        # Add edges
        for edge in network_data.get('edges', []):
            source = edge.get('source')
            target = edge.get('target')
            weight = edge.get('weight', 1)
            if source and target:
                G.add_edge(source, target, weight=weight)
        
        if G.number_of_nodes() == 0:
            return {
                'influence_scores': [],
                'top_influencers': []
            }
        
        # Calculate various centrality measures
        influence_scores = []
        
        try:
            # Degree centrality
            degree_centrality = nx.degree_centrality(G)
            
            # PageRank (for influence)
            pagerank = nx.pagerank(G, weight='weight')
            
            # Betweenness centrality
            betweenness = nx.betweenness_centrality(G, weight='weight')
            
            # Closeness centrality
            closeness = nx.closeness_centrality(G, distance='weight')
            
            # Combine scores
            for node in G.nodes():
                influence_score = (
                    pagerank.get(node, 0) * 0.4 +
                    degree_centrality.get(node, 0) * 0.3 +
                    betweenness.get(node, 0) * 0.2 +
                    closeness.get(node, 0) * 0.1
                )
                
                influence_scores.append({
                    'node': node,
                    'influence_score': float(influence_score),
                    'pagerank': float(pagerank.get(node, 0)),
                    'degree_centrality': float(degree_centrality.get(node, 0)),
                    'betweenness_centrality': float(betweenness.get(node, 0)),
                    'closeness_centrality': float(closeness.get(node, 0))
                })
            
            # Sort by influence score
            influence_scores.sort(key=lambda x: x['influence_score'], reverse=True)
            
            # Get top influencers
            top_influencers = influence_scores[:10]  # Top 10
            
            return {
                'influence_scores': influence_scores,
                'top_influencers': top_influencers
            }
        except Exception as e:
            # Fallback to simple degree centrality
            degree_centrality = nx.degree_centrality(G)
            influence_scores = [
                {
                    'node': node,
                    'influence_score': float(degree_centrality.get(node, 0)),
                    'degree_centrality': float(degree_centrality.get(node, 0))
                }
                for node in G.nodes()
            ]
            influence_scores.sort(key=lambda x: x['influence_score'], reverse=True)
            
            return {
                'influence_scores': influence_scores,
                'top_influencers': influence_scores[:10],
                'method': 'degree_centrality_fallback'
            }

