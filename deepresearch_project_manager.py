#!/usr/bin/env python3
"""
DeepResearch Project Manager
============================

Manages project repositories, templates, and collaborative development
workflows for the DeepResearch mode.

Features:
- Project templates for different types
- Collaborative development sessions
- Issue tracking and project boards
- Deployment management
- Real-time collaboration features

Author: Panther AI System
"""

import os
import json
import shutil
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
from deepresearch_version_control import Repository, VersionControlSystem, vcs

class ProjectTemplate:
    """Represents a project template"""

    def __init__(self, name: str, description: str, language: str, framework: str = "",
                 files: Dict[str, str] = None, dependencies: List[str] = None):
        self.name = name
        self.description = description
        self.language = language
        self.framework = framework
        self.files = files or {}
        self.dependencies = dependencies or []
        self.created_at = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert template to dictionary"""
        return {
            "name": self.name,
            "description": self.description,
            "language": self.language,
            "framework": self.framework,
            "files": self.files,
            "dependencies": self.dependencies,
            "created_at": self.created_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ProjectTemplate':
        """Create template from dictionary"""
        template = cls(
            name=data["name"],
            description=data["description"],
            language=data["language"],
            framework=data.get("framework", ""),
            files=data.get("files", {}),
            dependencies=data.get("dependencies", [])
        )
        template.created_at = datetime.fromisoformat(data["created_at"])
        return template

class Issue:
    """Represents an issue in the project"""

    def __init__(self, title: str, description: str, created_by: str,
                 issue_type: str = "bug", priority: str = "medium",
                 assignee: Optional[str] = None):
        self.id = self._generate_issue_id()
        self.title = title
        self.description = description
        self.created_by = created_by
        self.assignee = assignee
        self.issue_type = issue_type  # bug, feature, enhancement, task
        self.priority = priority  # low, medium, high, critical
        self.status = "open"  # open, in_progress, closed, resolved
        self.labels = []
        self.comments = []
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

    def _generate_issue_id(self) -> str:
        """Generate a unique issue ID"""
        import hashlib
        return hashlib.md5(f"{datetime.now().isoformat()}{self.title}".encode()).hexdigest()[:8]

    def add_comment(self, author: str, content: str):
        """Add a comment to the issue"""
        self.comments.append({
            "author": author,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        self.updated_at = datetime.now()

    def update_status(self, new_status: str, updated_by: str):
        """Update issue status"""
        self.status = new_status
        self.updated_at = datetime.now()
        self.add_comment(updated_by, f"Status changed to {new_status}")

    def to_dict(self) -> Dict[str, Any]:
        """Convert issue to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "created_by": self.created_by,
            "assignee": self.assignee,
            "issue_type": self.issue_type,
            "priority": self.priority,
            "status": self.status,
            "labels": self.labels,
            "comments": self.comments,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Issue':
        """Create issue from dictionary"""
        issue = cls(
            title=data["title"],
            description=data["description"],
            created_by=data["created_by"],
            issue_type=data.get("issue_type", "bug"),
            priority=data.get("priority", "medium"),
            assignee=data.get("assignee")
        )
        issue.id = data["id"]
        issue.status = data["status"]
        issue.labels = data.get("labels", [])
        issue.comments = data.get("comments", [])
        issue.created_at = datetime.fromisoformat(data["created_at"])
        issue.updated_at = datetime.fromisoformat(data["updated_at"])
        return issue

class PullRequest:
    """Represents a pull request"""

    def __init__(self, title: str, description: str, author: str,
                 source_branch: str, target_branch: str, repository: Repository):
        self.id = self._generate_pr_id()
        self.title = title
        self.description = description
        self.author = author
        self.source_branch = source_branch
        self.target_branch = target_branch
        self.repository = repository
        self.status = "open"  # open, merged, closed
        self.reviewers = []
        self.approvals = []
        self.comments = []
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

    def _generate_pr_id(self) -> str:
        """Generate a unique PR ID"""
        import hashlib
        return hashlib.md5(f"pr_{datetime.now().isoformat()}{self.title}".encode()).hexdigest()[:8]

    def add_reviewer(self, reviewer: str):
        """Add a reviewer to the PR"""
        if reviewer not in self.reviewers:
            self.reviewers.append(reviewer)

    def approve(self, reviewer: str):
        """Approve the PR"""
        if reviewer not in self.approvals:
            self.approvals.append(reviewer)
            self.add_comment(reviewer, "Approved this pull request")

    def add_comment(self, author: str, content: str):
        """Add a comment to the PR"""
        self.comments.append({
            "author": author,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        self.updated_at = datetime.now()

    def merge(self, merger: str) -> Tuple[bool, str]:
        """Merge the PR"""
        try:
            success, message = self.repository.merge_branches(
                self.source_branch,
                self.target_branch,
                merger
            )

            if success:
                self.status = "merged"
                self.add_comment(merger, f"Merged pull request: {message}")
            else:
                self.add_comment(merger, f"Failed to merge: {message}")

            return success, message
        except Exception as e:
            error_msg = f"Merge failed: {str(e)}"
            self.add_comment(merger, error_msg)
            return False, error_msg

    def to_dict(self) -> Dict[str, Any]:
        """Convert PR to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "author": self.author,
            "source_branch": self.source_branch,
            "target_branch": self.target_branch,
            "status": self.status,
            "reviewers": self.reviewers,
            "approvals": self.approvals,
            "comments": self.comments,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], repository: Repository) -> 'PullRequest':
        """Create PR from dictionary"""
        pr = cls(
            title=data["title"],
            description=data["description"],
            author=data["author"],
            source_branch=data["source_branch"],
            target_branch=data["target_branch"],
            repository=repository
        )
        pr.id = data["id"]
        pr.status = data["status"]
        pr.reviewers = data.get("reviewers", [])
        pr.approvals = data.get("approvals", [])
        pr.comments = data.get("comments", [])
        pr.created_at = datetime.fromisoformat(data["created_at"])
        pr.updated_at = datetime.fromisoformat(data["updated_at"])
        return pr

class CollaborationSession:
    """Represents a real-time collaboration session"""

    def __init__(self, session_id: str, project_id: str, initiator: str,
                 participants: List[str] = None):
        self.session_id = session_id
        self.project_id = project_id
        self.initiator = initiator
        self.participants = participants or [initiator]
        self.active_users = set([initiator])
        self.current_branch = "main"
        self.shared_cursor_positions = {}  # user -> (file, line, column)
        self.shared_selections = {}  # user -> (file, start_line, end_line)
        self.chat_messages = []
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.is_active = True

    def add_participant(self, user: str):
        """Add a participant to the session"""
        if user not in self.participants:
            self.participants.append(user)
        self.active_users.add(user)
        self.last_activity = datetime.now()

    def remove_participant(self, user: str):
        """Remove a participant from the session"""
        self.active_users.discard(user)
        self.last_activity = datetime.now()

        # Clean up user's cursor and selections
        if user in self.shared_cursor_positions:
            del self.shared_cursor_positions[user]
        if user in self.shared_selections:
            del self.shared_selections[user]

    def update_cursor_position(self, user: str, file_path: str, line: int, column: int):
        """Update cursor position for a user"""
        self.shared_cursor_positions[user] = (file_path, line, column)
        self.last_activity = datetime.now()

    def update_selection(self, user: str, file_path: str, start_line: int, end_line: int):
        """Update text selection for a user"""
        self.shared_selections[user] = (file_path, start_line, end_line)
        self.last_activity = datetime.now()

    def add_chat_message(self, user: str, message: str):
        """Add a chat message to the session"""
        self.chat_messages.append({
            "user": user,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        self.last_activity = datetime.now()

    def get_session_state(self) -> Dict[str, Any]:
        """Get current session state"""
        return {
            "session_id": self.session_id,
            "project_id": self.project_id,
            "participants": self.participants,
            "active_users": list(self.active_users),
            "current_branch": self.current_branch,
            "cursor_positions": self.shared_cursor_positions,
            "selections": self.shared_selections,
            "last_activity": self.last_activity.isoformat(),
            "is_active": self.is_active
        }

    def end_session(self):
        """End the collaboration session"""
        self.is_active = False
        self.last_activity = datetime.now()

class ProjectManager:
    """Main project management system"""

    def __init__(self):
        self.templates: Dict[str, ProjectTemplate] = {}
        self.active_sessions: Dict[str, CollaborationSession] = {}
        self._load_templates()

    def _load_templates(self):
        """Load project templates"""
        # Python templates
        self.templates["python-web-app"] = ProjectTemplate(
            name="Python Web Application",
            description="A basic Python web application with Flask",
            language="python",
            framework="flask",
            files={
                "app.py": """from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello, World!"

if __name__ == '__main__':
    app.run(debug=True)
""",
                "requirements.txt": """Flask==2.3.3
Werkzeug==2.3.7
""",
                "README.md": """# Python Web Application

A simple Flask web application.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the application:
   ```bash
   python app.py
   ```

## Features

- Basic Flask web server
- Hello World endpoint
"""
            },
            dependencies=["flask", "werkzeug"]
        )

        self.templates["python-data-analysis"] = ProjectTemplate(
            name="Python Data Analysis",
            description="Data analysis project with pandas and matplotlib",
            language="python",
            framework="pandas",
            files={
                "main.py": """import pandas as pd
import matplotlib.pyplot as plt

# Sample data analysis script
def main():
    # Create sample data
    data = {
        'x': [1, 2, 3, 4, 5],
        'y': [2, 4, 6, 8, 10]
    }

    df = pd.DataFrame(data)
    print("DataFrame:")
    print(df)

    # Create a simple plot
    plt.plot(df['x'], df['y'])
    plt.title('Sample Plot')
    plt.xlabel('X values')
    plt.ylabel('Y values')
    plt.savefig('plot.png')
    print("Plot saved as plot.png")

if __name__ == '__main__':
    main()
""",
                "requirements.txt": """pandas==2.0.3
matplotlib==3.7.2
numpy==1.24.3
""",
                "README.md": """# Data Analysis Project

A Python project for data analysis and visualization.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the analysis:
   ```bash
   python main.py
   ```
"""
            },
            dependencies=["pandas", "matplotlib", "numpy"]
        )

        # JavaScript templates
        self.templates["javascript-react-app"] = ProjectTemplate(
            name="React JavaScript Application",
            description="A basic React application",
            language="javascript",
            framework="react",
            files={
                "package.json": """{
  "name": "react-app",
  "version": "1.0.0",
  "description": "A React application",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  }
}
""",
                "public/index.html": """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
""",
                "src/App.js": """import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello, React!</h1>
        <p>Welcome to your new React application.</p>
      </header>
    </div>
  );
}

export default App;
""",
                "src/index.js": """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
""",
                "README.md": """# React Application

A modern React web application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Features

- Modern React setup
- Hot reloading
- Production build optimization
"""
            },
            dependencies=["react", "react-dom", "react-scripts"]
        )

    def get_template(self, template_name: str) -> Optional[ProjectTemplate]:
        """Get a project template by name"""
        return self.templates.get(template_name)

    def list_templates(self, language: Optional[str] = None) -> List[ProjectTemplate]:
        """List available templates, optionally filtered by language"""
        templates = list(self.templates.values())

        if language:
            templates = [t for t in templates if t.language == language]

        return templates

    def create_project_from_template(self, template_name: str, project_name: str,
                                   owner_agent: str) -> Optional[Repository]:
        """Create a new project from a template"""
        template = self.get_template(template_name)
        if not template:
            return None

        # Create repository
        project_id = f"{template_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        repo = vcs.create_repository(
            project_id=project_id,
            name=project_name,
            owner_agent=owner_agent,
            description=template.description,
            language=template.language
        )

        # Add template files
        changes = {}
        for file_path, content in template.files.items():
            changes[file_path] = ("", content)

        if changes:
            repo.commit_changes(
                author_agent=owner_agent,
                message=f"Initial commit from {template.name} template",
                changes=changes,
                branch_name="main"
            )

        return repo

    def create_collaboration_session(self, project_id: str, initiator: str) -> CollaborationSession:
        """Create a new collaboration session"""
        import uuid
        session_id = str(uuid.uuid4())[:8]

        session = CollaborationSession(session_id, project_id, initiator)
        self.active_sessions[session_id] = session

        return session

    def get_session(self, session_id: str) -> Optional[CollaborationSession]:
        """Get a collaboration session by ID"""
        return self.active_sessions.get(session_id)

    def end_session(self, session_id: str):
        """End a collaboration session"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id].end_session()
            # Keep session for history, but mark as inactive

    def get_active_sessions(self, project_id: Optional[str] = None) -> List[CollaborationSession]:
        """Get active collaboration sessions"""
        sessions = [s for s in self.active_sessions.values() if s.is_active]

        if project_id:
            sessions = [s for s in sessions if s.project_id == project_id]

        return sessions

    def create_issue(self, project_id: str, title: str, description: str,
                    created_by: str, issue_type: str = "bug",
                    priority: str = "medium") -> Issue:
        """Create a new issue for a project"""
        repo = vcs.get_repository(project_id)
        if not repo:
            raise ValueError(f"Repository '{project_id}' not found")

        if created_by not in repo.metadata["collaborators"]:
            raise ValueError(f"User '{created_by}' does not have access to project '{project_id}'")

        issue = Issue(title, description, created_by, issue_type, priority)

        # Save issue to repository
        issues_dir = repo.base_path / "issues"
        issues_dir.mkdir(exist_ok=True)

        issue_file = issues_dir / f"{issue.id}.json"
        with open(issue_file, 'w') as f:
            json.dump(issue.to_dict(), f, indent=2)

        return issue

    def get_project_issues(self, project_id: str, status: Optional[str] = None) -> List[Issue]:
        """Get issues for a project"""
        repo = vcs.get_repository(project_id)
        if not repo:
            return []

        issues = []
        issues_dir = repo.base_path / "issues"

        if issues_dir.exists():
            for issue_file in issues_dir.glob("*.json"):
                try:
                    with open(issue_file, 'r') as f:
                        issue_data = json.load(f)
                    issue = Issue.from_dict(issue_data)
                    if not status or issue.status == status:
                        issues.append(issue)
                except Exception as e:
                    print(f"Failed to load issue {issue_file}: {e}")

        return issues

    def create_pull_request(self, project_id: str, title: str, description: str,
                          author: str, source_branch: str, target_branch: str = "main") -> PullRequest:
        """Create a pull request"""
        repo = vcs.get_repository(project_id)
        if not repo:
            raise ValueError(f"Repository '{project_id}' not found")

        if author not in repo.metadata["collaborators"]:
            raise ValueError(f"User '{author}' does not have access to project '{project_id}'")

        pr = PullRequest(title, description, author, source_branch, target_branch, repo)

        # Save PR to repository
        prs_dir = repo.base_path / "pull_requests"
        prs_dir.mkdir(exist_ok=True)

        pr_file = prs_dir / f"{pr.id}.json"
        with open(pr_file, 'w') as f:
            json.dump(pr.to_dict(), f, indent=2)

        return pr

    def get_project_pull_requests(self, project_id: str, status: Optional[str] = None) -> List[PullRequest]:
        """Get pull requests for a project"""
        repo = vcs.get_repository(project_id)
        if not repo:
            return []

        prs = []
        prs_dir = repo.base_path / "pull_requests"

        if prs_dir.exists():
            for pr_file in prs_dir.glob("*.json"):
                try:
                    with open(pr_file, 'r') as f:
                        pr_data = json.load(f)
                    pr = PullRequest.from_dict(pr_data, repo)
                    if not status or pr.status == status:
                        prs.append(pr)
                except Exception as e:
                    print(f"Failed to load PR {pr_file}: {e}")

        return prs

# Global project manager instance
project_manager = ProjectManager()

# Integration functions for DeepResearch mode
def initialize_project_from_prompt(prompt: str, agent_id: str) -> Repository:
    """Initialize a project based on a research prompt"""
    # Determine project type from prompt
    prompt_lower = prompt.lower()

    if "web" in prompt_lower or "website" in prompt_lower or "app" in prompt_lower:
        if "python" in prompt_lower or "flask" in prompt_lower or "django" in prompt_lower:
            template_name = "python-web-app"
        elif "javascript" in prompt_lower or "react" in prompt_lower or "vue" in prompt_lower:
            template_name = "javascript-react-app"
        else:
            template_name = "python-web-app"  # default
    elif "data" in prompt_lower or "analysis" in prompt_lower or "pandas" in prompt_lower:
        template_name = "python-data-analysis"
    else:
        template_name = "python-web-app"  # default

    # Generate project name
    project_name = prompt[:50].replace(" ", "_").replace("?", "").replace("!", "")

    # Create project from template
    repo = project_manager.create_project_from_template(
        template_name=template_name,
        project_name=project_name,
        owner_agent=agent_id
    )

    if not repo:
        # Fallback to basic repository creation
        from deepresearch_version_control import create_project_repository
        repo = create_project_repository(prompt, agent_id)

    return repo

def start_collaboration_session(project_id: str, initiator: str) -> CollaborationSession:
    """Start a collaboration session for a project"""
    return project_manager.create_collaboration_session(project_id, initiator)

def get_collaboration_updates(session_id: str) -> Dict[str, Any]:
    """Get real-time updates for a collaboration session"""
    session = project_manager.get_session(session_id)
    if not session:
        return {"error": "Session not found"}

    return session.get_session_state()

if __name__ == "__main__":
    # Example usage
    print("DeepResearch Project Manager")
    print("============================")

    # List available templates
    templates = project_manager.list_templates()
    print(f"Available templates: {len(templates)}")
    for template in templates:
        print(f"  - {template.name}: {template.description}")

    # Create a project from template
    try:
        repo = project_manager.create_project_from_template(
            "python-web-app",
            "MyWebApp",
            "test_agent"
        )
        print(f"Created project: {repo.name} ({repo.project_id})")

        # Create an issue
        issue = project_manager.create_issue(
            repo.project_id,
            "Add user authentication",
            "Implement user login and registration functionality",
            "test_agent",
            "feature",
            "high"
        )
        print(f"Created issue: {issue.title} ({issue.id})")

        # Start collaboration session
        session = project_manager.create_collaboration_session(repo.project_id, "test_agent")
        print(f"Started collaboration session: {session.session_id}")

    except Exception as e:
        print(f"Error: {e}")