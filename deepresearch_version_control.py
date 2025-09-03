#!/usr/bin/env python3
"""
DeepResearch Version Control System
====================================

A Git-like version control system designed for multi-agent collaborative development
within the DeepResearch mode of Panther AI.

Features:
- Repository management
- Branching and merging
- Commit history tracking
- File change tracking
- Conflict resolution
- Multi-agent collaboration support

Author: Panther AI System
"""

import os
import json
import hashlib
import shutil
import tempfile
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import difflib
import uuid

class Commit:
    """Represents a commit in the version control system"""

    def __init__(self, author_agent: str, message: str, parent_commit: Optional[str] = None,
                 timestamp: Optional[datetime] = None):
        self.id = self._generate_commit_id()
        self.author_agent = author_agent
        self.message = message
        self.parent_commit = parent_commit
        self.timestamp = timestamp or datetime.now()
        self.changes = {}  # Dict of file_path -> (old_content, new_content)
        self.metadata = {
            "agent_role": "unknown",
            "review_status": "pending",
            "test_status": "pending",
            "deployment_status": "pending"
        }

    def _generate_commit_id(self) -> str:
        """Generate a unique commit ID"""
        return hashlib.sha256(f"{uuid.uuid4()}{datetime.now().isoformat()}".encode()).hexdigest()[:16]

    def add_change(self, file_path: str, old_content: str, new_content: str):
        """Add a file change to this commit"""
        self.changes[file_path] = (old_content, new_content)

    def to_dict(self) -> Dict[str, Any]:
        """Convert commit to dictionary for serialization"""
        return {
            "id": self.id,
            "author_agent": self.author_agent,
            "message": self.message,
            "parent_commit": self.parent_commit,
            "timestamp": self.timestamp.isoformat(),
            "changes": self.changes,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Commit':
        """Create commit from dictionary"""
        commit = cls(
            author_agent=data["author_agent"],
            message=data["message"],
            parent_commit=data.get("parent_commit"),
            timestamp=datetime.fromisoformat(data["timestamp"])
        )
        commit.id = data["id"]
        commit.changes = data["changes"]
        commit.metadata = data.get("metadata", commit.metadata)
        return commit

class Branch:
    """Represents a branch in the repository"""

    def __init__(self, name: str, created_by: str, head_commit: Optional[str] = None):
        self.name = name
        self.created_by = created_by
        self.head_commit = head_commit
        self.created_at = datetime.now()
        self.is_default = False
        self.metadata = {
            "description": "",
            "protected": False,
            "collaborators": []
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert branch to dictionary for serialization"""
        return {
            "name": self.name,
            "created_by": self.created_by,
            "head_commit": self.head_commit,
            "created_at": self.created_at.isoformat(),
            "is_default": self.is_default,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Branch':
        """Create branch from dictionary"""
        branch = cls(
            name=data["name"],
            created_by=data["created_by"],
            head_commit=data.get("head_commit")
        )
        branch.created_at = datetime.fromisoformat(data["created_at"])
        branch.is_default = data.get("is_default", False)
        branch.metadata = data.get("metadata", branch.metadata)
        return branch

class Repository:
    """Represents a project repository"""

    def __init__(self, project_id: str, name: str, owner_agent: str, base_path: str = "./repositories"):
        self.project_id = project_id
        self.name = name
        self.owner_agent = owner_agent
        self.base_path = Path(base_path) / project_id
        self.branches: Dict[str, Branch] = {}
        self.commits: Dict[str, Commit] = {}
        self.files: Dict[str, str] = {}  # file_path -> content
        self.created_at = datetime.now()
        self.metadata = {
            "description": "",
            "language": "python",
            "framework": "",
            "collaborators": [owner_agent],
            "visibility": "private",  # private, public, shared
            "tags": []
        }

        # Initialize repository structure
        self._initialize_repository()

    def _initialize_repository(self):
        """Initialize the repository directory structure"""
        # Create main directories
        (self.base_path / ".deepresearch").mkdir(parents=True, exist_ok=True)
        (self.base_path / "branches").mkdir(exist_ok=True)
        (self.base_path / "commits").mkdir(exist_ok=True)
        (self.base_path / "files").mkdir(exist_ok=True)
        (self.base_path / "issues").mkdir(exist_ok=True)
        (self.base_path / "pull_requests").mkdir(exist_ok=True)

        # Create default main branch
        main_branch = Branch("main", self.owner_agent)
        main_branch.is_default = True
        self.branches["main"] = main_branch

        # Create initial commit
        initial_commit = Commit(
            author_agent=self.owner_agent,
            message="Initial commit",
            parent_commit=None
        )
        self.commits[initial_commit.id] = initial_commit
        main_branch.head_commit = initial_commit.id

        # Save repository state
        self._save_repository_state()

    def _save_repository_state(self):
        """Save repository state to disk"""
        repo_data = {
            "project_id": self.project_id,
            "name": self.name,
            "owner_agent": self.owner_agent,
            "created_at": self.created_at.isoformat(),
            "metadata": self.metadata,
            "branches": {name: branch.to_dict() for name, branch in self.branches.items()},
            "commits": {cid: commit.to_dict() for cid, commit in self.commits.items()},
            "files": self.files
        }

        with open(self.base_path / ".deepresearch" / "repository.json", 'w') as f:
            json.dump(repo_data, f, indent=2)

    def _load_repository_state(self):
        """Load repository state from disk"""
        repo_file = self.base_path / ".deepresearch" / "repository.json"
        if repo_file.exists():
            with open(repo_file, 'r') as f:
                data = json.load(f)

            self.metadata = data.get("metadata", self.metadata)
            self.branches = {name: Branch.from_dict(bdata)
                           for name, bdata in data.get("branches", {}).items()}
            self.commits = {cid: Commit.from_dict(cdata)
                          for cid, cdata in data.get("commits", {}).items()}
            self.files = data.get("files", {})

    def create_branch(self, branch_name: str, from_branch: str = "main", created_by: str = "system") -> Branch:
        """Create a new branch from an existing branch"""
        if branch_name in self.branches:
            raise ValueError(f"Branch '{branch_name}' already exists")

        if from_branch not in self.branches:
            raise ValueError(f"Source branch '{from_branch}' does not exist")

        source_branch = self.branches[from_branch]
        new_branch = Branch(branch_name, created_by, source_branch.head_commit)
        self.branches[branch_name] = new_branch

        self._save_repository_state()
        return new_branch

    def commit_changes(self, author_agent: str, message: str, changes: Dict[str, Tuple[str, str]],
                      branch_name: str = "main") -> Commit:
        """Commit changes to a branch"""
        if branch_name not in self.branches:
            raise ValueError(f"Branch '{branch_name}' does not exist")

        branch = self.branches[branch_name]

        # Create new commit
        commit = Commit(
            author_agent=author_agent,
            message=message,
            parent_commit=branch.head_commit
        )

        # Add changes to commit
        for file_path, (old_content, new_content) in changes.items():
            commit.add_change(file_path, old_content, new_content)
            self.files[file_path] = new_content

        # Update branch head
        branch.head_commit = commit.id
        self.commits[commit.id] = commit

        self._save_repository_state()
        return commit

    def get_file_content(self, file_path: str, branch_name: str = "main") -> Optional[str]:
        """Get file content from a specific branch"""
        if branch_name not in self.branches:
            raise ValueError(f"Branch '{branch_name}' does not exist")

        branch = self.branches[branch_name]
        if not branch.head_commit:
            return None

        # Walk through commit history to find the latest version of the file
        current_commit = branch.head_commit
        while current_commit:
            commit = self.commits[current_commit]
            if file_path in commit.changes:
                return commit.changes[file_path][1]  # Return new_content
            current_commit = commit.parent_commit

        # If not found in commits, check current files
        return self.files.get(file_path)

    def get_commit_history(self, branch_name: str = "main", limit: int = 50) -> List[Commit]:
        """Get commit history for a branch"""
        if branch_name not in self.branches:
            raise ValueError(f"Branch '{branch_name}' does not exist")

        branch = self.branches[branch_name]
        if not branch.head_commit:
            return []

        history = []
        current_commit = branch.head_commit

        while current_commit and len(history) < limit:
            commit = self.commits[current_commit]
            history.append(commit)
            current_commit = commit.parent_commit

        return history

    def merge_branches(self, source_branch: str, target_branch: str, author_agent: str) -> Tuple[bool, str]:
        """Merge source branch into target branch"""
        if source_branch not in self.branches or target_branch not in self.branches:
            return False, "One or both branches do not exist"

        source = self.branches[source_branch]
        target = self.branches[target_branch]

        if not source.head_commit:
            return False, "Source branch has no commits"

        if not target.head_commit:
            return False, "Target branch has no commits"

        # Check for conflicts (simplified version)
        conflicts = self._check_merge_conflicts(source_branch, target_branch)
        if conflicts:
            return False, f"Merge conflicts detected: {', '.join(conflicts)}"

        # Create merge commit
        merge_message = f"Merge branch '{source_branch}' into '{target_branch}'"
        merge_commit = Commit(
            author_agent=author_agent,
            message=merge_message,
            parent_commit=target.head_commit
        )

        # Add merge reference
        merge_commit.metadata["merge_sources"] = [source.head_commit]

        # Update target branch
        target.head_commit = merge_commit.id
        self.commits[merge_commit.id] = merge_commit

        self._save_repository_state()
        return True, f"Successfully merged {source_branch} into {target_branch}"

    def _check_merge_conflicts(self, source_branch: str, target_branch: str) -> List[str]:
        """Check for merge conflicts between branches"""
        conflicts = []

        # Get files modified in both branches since their common ancestor
        source_files = self._get_modified_files(source_branch)
        target_files = self._get_modified_files(target_branch)

        for file_path in source_files:
            if file_path in target_files:
                conflicts.append(file_path)

        return conflicts

    def _get_modified_files(self, branch_name: str) -> List[str]:
        """Get list of files modified in a branch"""
        if branch_name not in self.branches:
            return []

        branch = self.branches[branch_name]
        if not branch.head_commit:
            return []

        modified_files = []
        current_commit = branch.head_commit

        # Walk through commits and collect modified files
        while current_commit:
            commit = self.commits[current_commit]
            modified_files.extend(commit.changes.keys())

            # Stop at the first commit (initial commit)
            if not commit.parent_commit:
                break

            current_commit = commit.parent_commit

        return list(set(modified_files))  # Remove duplicates

    def get_diff(self, commit_id1: str, commit_id2: str) -> Dict[str, List[str]]:
        """Get diff between two commits"""
        if commit_id1 not in self.commits or commit_id2 not in self.commits:
            raise ValueError("One or both commits do not exist")

        commit1 = self.commits[commit_id1]
        commit2 = self.commits[commit_id2]

        diff_result = {}

        # Get all files from both commits
        all_files = set(commit1.changes.keys()) | set(commit2.changes.keys())

        for file_path in all_files:
            content1 = commit1.changes.get(file_path, ("", ""))[1]
            content2 = commit2.changes.get(file_path, ("", ""))[1]

            if content1 != content2:
                # Generate unified diff
                diff = list(difflib.unified_diff(
                    content1.splitlines(keepends=True),
                    content2.splitlines(keepends=True),
                    fromfile=f"a/{file_path}",
                    tofile=f"b/{file_path}",
                    lineterm=""
                ))
                diff_result[file_path] = diff

        return diff_result

    def add_collaborator(self, agent_id: str, role: str = "developer"):
        """Add a collaborator to the repository"""
        if agent_id not in self.metadata["collaborators"]:
            self.metadata["collaborators"].append(agent_id)

        # Update all branches with collaborator info
        for branch in self.branches.values():
            if agent_id not in branch.metadata["collaborators"]:
                branch.metadata["collaborators"].append(agent_id)

        self._save_repository_state()

    def remove_collaborator(self, agent_id: str):
        """Remove a collaborator from the repository"""
        if agent_id in self.metadata["collaborators"]:
            self.metadata["collaborators"].remove(agent_id)

        # Update all branches
        for branch in self.branches.values():
            if agent_id in branch.metadata["collaborators"]:
                branch.metadata["collaborators"].remove(agent_id)

        self._save_repository_state()

class VersionControlSystem:
    """Main version control system manager"""

    def __init__(self, base_path: str = "./repositories"):
        self.base_path = Path(base_path)
        self.repositories: Dict[str, Repository] = {}
        self.base_path.mkdir(exist_ok=True)

        # Load existing repositories
        self._load_repositories()

    def _load_repositories(self):
        """Load all existing repositories"""
        if not self.base_path.exists():
            return

        for repo_dir in self.base_path.iterdir():
            if repo_dir.is_dir() and (repo_dir / ".deepresearch" / "repository.json").exists():
                try:
                    repo = Repository(repo_dir.name, "", "", str(self.base_path))
                    repo._load_repository_state()
                    self.repositories[repo.project_id] = repo
                except Exception as e:
                    print(f"Failed to load repository {repo_dir.name}: {e}")

    def create_repository(self, project_id: str, name: str, owner_agent: str,
                         description: str = "", language: str = "python") -> Repository:
        """Create a new repository"""
        if project_id in self.repositories:
            raise ValueError(f"Repository '{project_id}' already exists")

        repo = Repository(project_id, name, owner_agent, str(self.base_path))
        repo.metadata["description"] = description
        repo.metadata["language"] = language

        self.repositories[project_id] = repo
        return repo

    def get_repository(self, project_id: str) -> Optional[Repository]:
        """Get a repository by ID"""
        return self.repositories.get(project_id)

    def list_repositories(self, agent_id: Optional[str] = None) -> List[Repository]:
        """List all repositories, optionally filtered by agent access"""
        repos = list(self.repositories.values())

        if agent_id:
            repos = [repo for repo in repos if agent_id in repo.metadata["collaborators"]]

        return repos

    def delete_repository(self, project_id: str, agent_id: str) -> bool:
        """Delete a repository (only owner can delete)"""
        if project_id not in self.repositories:
            return False

        repo = self.repositories[project_id]
        if repo.owner_agent != agent_id:
            return False

        # Remove from memory
        del self.repositories[project_id]

        # Remove from disk
        shutil.rmtree(repo.base_path, ignore_errors=True)

        return True

# Global VCS instance
vcs = VersionControlSystem()

# Utility functions for integration with DeepResearch mode
def create_project_repository(prompt: str, agent_id: str) -> Repository:
    """Create a new project repository based on a research prompt"""
    # Generate project ID from prompt
    project_id = hashlib.md5(prompt.encode()).hexdigest()[:12]

    # Extract project name from prompt
    name = prompt[:50].replace(" ", "_").replace("?", "").replace("!", "")

    # Determine language/framework from prompt
    language = "python"  # default
    if "javascript" in prompt.lower() or "js" in prompt.lower():
        language = "javascript"
    elif "java" in prompt.lower():
        language = "java"
    elif "cpp" in prompt.lower() or "c++" in prompt.lower():
        language = "cpp"
    elif "web" in prompt.lower() or "html" in prompt.lower():
        language = "html"

    repo = vcs.create_repository(
        project_id=project_id,
        name=name,
        owner_agent=agent_id,
        description=f"Auto-generated project for: {prompt}",
        language=language
    )

    return repo

def get_agent_repositories(agent_id: str) -> List[Repository]:
    """Get all repositories accessible by an agent"""
    return vcs.list_repositories(agent_id)

def collaborate_on_project(project_id: str, agent_id: str, action: str, **kwargs) -> Any:
    """Perform collaborative actions on a project"""
    repo = vcs.get_repository(project_id)
    if not repo:
        raise ValueError(f"Repository '{project_id}' not found")

    if agent_id not in repo.metadata["collaborators"]:
        raise ValueError(f"Agent '{agent_id}' does not have access to repository '{project_id}'")

    if action == "create_branch":
        return repo.create_branch(
            kwargs.get("branch_name", "feature"),
            kwargs.get("from_branch", "main"),
            agent_id
        )

    elif action == "commit_changes":
        return repo.commit_changes(
            author_agent=agent_id,
            message=kwargs.get("message", "Update"),
            changes=kwargs.get("changes", {}),
            branch_name=kwargs.get("branch_name", "main")
        )

    elif action == "get_file":
        return repo.get_file_content(
            kwargs.get("file_path", ""),
            kwargs.get("branch_name", "main")
        )

    elif action == "merge_branches":
        return repo.merge_branches(
            kwargs.get("source_branch", ""),
            kwargs.get("target_branch", "main"),
            agent_id
        )

    elif action == "get_history":
        return repo.get_commit_history(
            kwargs.get("branch_name", "main"),
            kwargs.get("limit", 10)
        )

    else:
        raise ValueError(f"Unknown action: {action}")

if __name__ == "__main__":
    # Example usage
    print("DeepResearch Version Control System")
    print("====================================")

    # Create a test repository
    try:
        repo = create_project_repository("Create a Python web application", "test_agent")
        print(f"Created repository: {repo.name} ({repo.project_id})")

        # Create a feature branch
        branch = repo.create_branch("feature-login", "main", "test_agent")
        print(f"Created branch: {branch.name}")

        # Make some changes
        changes = {
            "app.py": ("", "# New Python application\nprint('Hello, World!')"),
            "README.md": ("", "# My Project\n\nThis is a test project.")
        }

        # Commit changes
        commit = repo.commit_changes("test_agent", "Initial implementation", changes, "feature-login")
        print(f"Created commit: {commit.id}")

        # Get commit history
        history = repo.get_commit_history("feature-login")
        print(f"Commit history: {len(history)} commits")

    except Exception as e:
        print(f"Error: {e}")