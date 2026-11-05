package com.banking.fraud.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class GatewayHeaderAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String userId = request.getHeader("X-User-Id");
        String userRole = request.getHeader("X-User-Role");
        String userEmail = request.getHeader("X-User-Email");

        if (userId == null || userId.isBlank() || userRole == null || userRole.isBlank()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing gateway authentication headers.");
            return;
        }

        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(userRole));
        Authentication authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);
        ((UsernamePasswordAuthenticationToken) authentication).setDetails(userEmail);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }
}
